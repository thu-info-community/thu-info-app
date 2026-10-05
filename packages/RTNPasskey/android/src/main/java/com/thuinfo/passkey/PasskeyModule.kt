package com.thuinfo.passkey

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyInfo
import android.security.keystore.KeyProperties
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.StrongBoxUnavailableException
import android.util.Base64
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.LifecycleState
import com.facebook.react.module.annotations.ReactModule
import org.json.JSONObject
import java.io.File
import java.math.BigInteger
import java.nio.ByteBuffer
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.MessageDigest
import java.security.PrivateKey
import java.security.SecureRandom
import java.security.Signature
import java.security.interfaces.ECPublicKey
import java.security.spec.ECGenParameterSpec
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ExecutionException
import java.util.concurrent.atomic.AtomicLong

@ReactModule(name = PasskeyModule.NAME)
class PasskeyModule(private val context: ReactApplicationContext) : NativePasskeySpec(context), LifecycleEventListener {
    companion object {
        const val NAME = "RTNPasskey"
        private const val PREFIX = "thuinfo.passkey."
        private const val RP_ID = "tsinghua.edu.cn"
        private const val ORIGIN = "https://id.tsinghua.edu.cn"
    }
    private val executor = Executors.newSingleThreadExecutor()
    private val preferences = context.getSharedPreferences("thuinfo.passkey", Context.MODE_PRIVATE)
    private val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    private val lockGeneration = AtomicLong()
    @Volatile private var closed = false
    private class Failure(val code: String) : Exception()
    private class Authentication(val generation: Long) {
        val result = CompletableFuture<Signature>()
        @Volatile var prompt: BiometricPrompt? = null
    }
    @Volatile private var authentication: Authentication? = null
    private val screenOffReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_OFF) cancelAuthentication("PASSKEY_LOCKED")
        }
    }
    init {
        context.addLifecycleEventListener(this)
        if (Build.VERSION.SDK_INT >= 33) {
            context.registerReceiver(screenOffReceiver, IntentFilter(Intent.ACTION_SCREEN_OFF), Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(screenOffReceiver, IntentFilter(Intent.ACTION_SCREEN_OFF))
        }
    }
    override fun getName() = NAME

    private fun operation(promise: Promise, action: () -> Any?) {
        executor.execute {
            try {
                if (closed) throw Failure("PASSKEY_CANCELED")
                promise.resolve(action())
            }
            catch (error: Exception) {
                // Do not leak keys, challenges, identifiers or platform diagnostics into UI/logs.
                val cause = if (error is ExecutionException) error.cause else error
                val code = when (cause) {
                    is Failure -> cause.code
                    is KeyPermanentlyInvalidatedException -> "PASSKEY_KEY_INVALIDATED"
                    else -> "PASSKEY_UNAVAILABLE"
                }
                promise.reject(code, code)
            }
        }
    }
    private fun ensureUnlocked() {
        if (closed) throw Failure("PASSKEY_CANCELED")
        val keyguard = context.getSystemService(KeyguardManager::class.java)
        if (keyguard.isDeviceLocked || keyguard.isKeyguardLocked) throw Failure("PASSKEY_LOCKED")
    }
    private fun ensureForeground() {
        if (context.lifecycleState != LifecycleState.RESUMED) throw Failure("PASSKEY_INTERACTION_REQUIRED")
    }
    private fun authenticators(): Int = BiometricManager.Authenticators.BIOMETRIC_STRONG or
        if (Build.VERSION.SDK_INT >= 30) BiometricManager.Authenticators.DEVICE_CREDENTIAL else 0
    private fun verificationAvailability(): String {
        if (!context.getSystemService(KeyguardManager::class.java).isDeviceSecure) return "not-configured"
        return when (BiometricManager.from(context).canAuthenticate(authenticators())) {
            BiometricManager.BIOMETRIC_SUCCESS -> "available"
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> "not-configured"
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
            BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> "unsupported"
            else -> "unknown"
        }
    }
    private fun keyInfo(name: String): KeyInfo = KeyFactory.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore")
        .getKeySpec(store.getKey(name, null) as PrivateKey, KeyInfo::class.java)
    private fun cancelAuthentication(code: String) {
        lockGeneration.incrementAndGet()
        val pending = authentication ?: return
        pending.result.completeExceptionally(Failure(code))
        UiThreadUtil.runOnUiThread { pending.prompt?.cancelAuthentication() }
    }
    private fun authorize(signer: Signature): Signature {
        ensureForeground()
        val pending = Authentication(lockGeneration.get())
        authentication = pending
        UiThreadUtil.runOnUiThread {
            try {
                if (pending.result.isDone) return@runOnUiThread
                ensureUnlocked()
                ensureForeground()
                val activity = context.currentActivity as? FragmentActivity
                    ?: throw Failure("PASSKEY_INTERACTION_REQUIRED")
                if (activity.isFinishing || activity.isDestroyed) throw Failure("PASSKEY_INTERACTION_REQUIRED")
                val prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(context), object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        val authorized = result.cryptoObject?.signature
                        if (authorized === signer && lockGeneration.get() == pending.generation) pending.result.complete(authorized)
                        else pending.result.completeExceptionally(Failure("PASSKEY_CANCELED"))
                    }
                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        val code = when (errorCode) {
                            BiometricPrompt.ERROR_CANCELED, BiometricPrompt.ERROR_USER_CANCELED,
                            BiometricPrompt.ERROR_NEGATIVE_BUTTON -> "PASSKEY_CANCELED"
                            else -> "PASSKEY_AUTH_UNAVAILABLE"
                        }
                        pending.result.completeExceptionally(Failure(code))
                    }
                })
                pending.prompt = prompt
                val english = context.resources.configuration.locales[0].language != "zh"
                val builder = BiometricPrompt.PromptInfo.Builder()
                    .setTitle(if (english) "Passkey login" else "Passkey 登录")
                    .setAllowedAuthenticators(authenticators())
                if (Build.VERSION.SDK_INT < 30) builder.setNegativeButtonText(if (english) "Cancel" else "取消")
                prompt.authenticate(builder.build(), BiometricPrompt.CryptoObject(signer))
            } catch (error: Exception) { pending.result.completeExceptionally(error) }
        }
        // Only this module's worker waits. Native operations stay serialized throughout the prompt.
        try {
            val authorized = pending.result.get()
            ensureUnlocked()
            if (lockGeneration.get() != pending.generation) throw Failure("PASSKEY_CANCELED")
            return authorized
        } finally { if (authentication === pending) authentication = null }
    }
    private fun alias(keyId: String): String {
        require(Regex("^[0-9a-f-]{36}$").matches(keyId))
        return PREFIX + keyId
    }
    private fun encode(bytes: ByteArray): String = Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    private fun sha256(bytes: ByteArray): ByteArray = MessageDigest.getInstance("SHA-256").digest(bytes)
    private fun coordinate(value: BigInteger): ByteArray = value.toByteArray().let { input ->
        require(input.size <= 33)
        if (input.size > 32) input.copyOfRange(input.size - 32, input.size)
        else ByteArray(32 - input.size) + input
    }
    private fun read(keyId: String): JSONObject? {
        val name = alias(keyId)
        if (!store.containsAlias(name)) return null
        return preferences.getString(name, null)?.let {
            JSONObject(it).put("authenticationMode", if (keyInfo(name).isUserAuthenticationRequired) "required" else "silent")
        }
    }

    // This is only a risk hint; missing su files do not prove device integrity.
    private fun rootDetected(): Boolean = listOf(
        "/system/bin/",
        "/system/xbin/",
        "/system/sbin/",
        "/sbin/",
        "/vendor/bin/",
    ).any { path ->
        try { File(path, "su").exists() }
        catch (_: Exception) { false }
    }

    override fun getCapabilities(promise: Promise) = operation(promise) {
        JSONObject().put("available", true).put("rootDetected", rootDetected())
            .put("verificationAvailability", verificationAvailability()).toString()
    }

    override fun createCredential(mode: String, promise: Promise) = operation(promise) {
        require(mode == "required" || mode == "silent")
        ensureUnlocked()
        if (mode == "required") {
            ensureForeground()
            if (verificationAvailability() != "available") throw Failure("PASSKEY_AUTH_UNAVAILABLE")
        }
        val keyId = UUID.randomUUID().toString()
        val name = alias(keyId)
        fun generate(strongBox: Boolean) {
            val generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore")
            val builder = KeyGenParameterSpec.Builder(name, KeyProperties.PURPOSE_SIGN)
                .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
                .setDigests(KeyProperties.DIGEST_SHA256)
                .setUserAuthenticationRequired(mode == "required")
            if (mode == "required") {
                if (Build.VERSION.SDK_INT >= 30) {
                    builder.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL)
                } else {
                    @Suppress("DEPRECATION")
                    builder.setUserAuthenticationValidityDurationSeconds(-1)
                }
            }
            if (Build.VERSION.SDK_INT >= 28) builder.setIsStrongBoxBacked(strongBox)
            generator.initialize(builder.build())
            generator.generateKeyPair()
        }
        try {
            val strongBox = Build.VERSION.SDK_INT >= 28 && context.packageManager.hasSystemFeature(PackageManager.FEATURE_STRONGBOX_KEYSTORE)
            if (strongBox) {
                try { generate(true) }
                catch (error: StrongBoxUnavailableException) { generate(false) }
            } else generate(false)
            val publicKey = store.getCertificate(name).publicKey as ECPublicKey
            val privateKey = store.getKey(name, null) as PrivateKey
            val info = KeyFactory.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore").getKeySpec(privateKey, KeyInfo::class.java)
            val protection = if (Build.VERSION.SDK_INT >= 31) {
                when (info.securityLevel) {
                    KeyProperties.SECURITY_LEVEL_STRONGBOX -> "strongbox"
                    KeyProperties.SECURITY_LEVEL_TRUSTED_ENVIRONMENT -> "tee"
                    KeyProperties.SECURITY_LEVEL_SOFTWARE -> "software"
                    else -> "unknown"
                }
            } else {
                @Suppress("DEPRECATION")
                if (info.isInsideSecureHardware) "hardware" else "software"
            }
            val metadata = JSONObject().put("keyId", keyId)
                .put("credentialId", encode(ByteArray(32).also { SecureRandom().nextBytes(it) }))
                .put("publicKeyX", encode(coordinate(publicKey.w.affineX)))
                .put("publicKeyY", encode(coordinate(publicKey.w.affineY)))
                .put("protectionLevel", protection)
                .put("authenticationMode", if (info.isUserAuthenticationRequired) "required" else "silent")
            check(metadata.getString("authenticationMode") == mode)
            check(preferences.edit().putString(name, metadata.toString()).putLong(name + ".counter", 0).commit())
            metadata.toString()
        } catch (error: Exception) {
            store.deleteEntry(name)
            preferences.edit().remove(name).remove(name + ".counter").commit()
            throw error
        }
    }

    override fun getCredential(keyId: String, promise: Promise) = operation(promise) { read(keyId)?.toString() ?: "null" }

    override fun signAssertion(keyId: String, challenge: String, promise: Promise) = operation(promise) {
        ensureUnlocked()
        val generation = lockGeneration.get()
        require(challenge.length in 16..1024 && Regex("^[A-Za-z0-9_-]+$").matches(challenge))
        val metadata = read(keyId) ?: throw Failure("PASSKEY_KEY_INVALIDATED")
        val name = alias(keyId)
        val counter = preferences.getLong(name + ".counter", 0) + 1
        require(counter in 1..0xffffffffL)
        // Persist before signing; gaps after a failed request are fine, rollback/reuse is not.
        check(preferences.edit().putLong(name + ".counter", counter).commit())
        val client = JSONObject().put("type", "webauthn.get").put("challenge", challenge)
            .put("origin", ORIGIN).put("crossOrigin", false).toString().toByteArray(Charsets.UTF_8)
        // The school's current validator requires UP and UV. Silent mode declares
        // those flags in software: this is NOT evidence of per-use PIN/biometry.
        val authenticator = sha256(RP_ID.toByteArray(Charsets.UTF_8)) + byteArrayOf(0x05) + ByteBuffer.allocate(4).putInt(counter.toInt()).array()
        var signer = Signature.getInstance("SHA256withECDSA")
        signer.initSign(store.getKey(name, null) as PrivateKey)
        if (metadata.getString("authenticationMode") == "required") signer = authorize(signer)
        signer.update(authenticator + sha256(client))
        val signature = signer.sign()
        ensureUnlocked()
        if (lockGeneration.get() != generation) throw Failure("PASSKEY_CANCELED")
        JSONObject().put("clientDataJSON", encode(client)).put("authenticatorData", encode(authenticator))
            .put("signature", encode(signature)).toString()
    }

    override fun deleteCredential(keyId: String, promise: Promise) = operation(promise) {
        val name = alias(keyId)
        store.deleteEntry(name)
        check(preferences.edit().remove(name).remove(name + ".counter").commit())
        null
    }

    override fun invalidate() {
        closed = true
        cancelAuthentication("PASSKEY_CANCELED")
        context.removeLifecycleEventListener(this)
        context.unregisterReceiver(screenOffReceiver)
        executor.shutdown()
        super.invalidate()
    }
    override fun onHostResume() {}
    // Device-credential UI may pause the activity while authorizing the CryptoObject.
    override fun onHostPause() {}
    override fun onHostDestroy() { cancelAuthentication("PASSKEY_CANCELED") }
}
