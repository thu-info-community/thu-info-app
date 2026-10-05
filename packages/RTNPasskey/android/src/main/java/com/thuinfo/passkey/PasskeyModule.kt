package com.thuinfo.passkey

import android.app.KeyguardManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyInfo
import android.security.keystore.KeyProperties
import android.security.keystore.StrongBoxUnavailableException
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import org.json.JSONObject
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

@ReactModule(name = PasskeyModule.NAME)
class PasskeyModule(private val context: ReactApplicationContext) : NativePasskeySpec(context) {
    companion object {
        const val NAME = "RTNPasskey"
        private const val PREFIX = "thuinfo.passkey."
        private const val RP_ID = "tsinghua.edu.cn"
        private const val ORIGIN = "https://id.tsinghua.edu.cn"
    }
    private val executor = Executors.newSingleThreadExecutor()
    private val preferences = context.getSharedPreferences("thuinfo.passkey", Context.MODE_PRIVATE)
    private val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    override fun getName() = NAME

    private fun operation(promise: Promise, action: () -> Any?) {
        executor.execute {
            try { promise.resolve(action()) }
            catch (error: Exception) {
                // Do not leak keys, challenges, identifiers or platform diagnostics into UI/logs.
                val code = if (error is LockedException) "PASSKEY_LOCKED" else "PASSKEY_UNAVAILABLE"
                promise.reject(code, if (error is LockedException) "请解锁后再试。" else "此设备的 Passkey 暂不可用，请重新设置。")
            }
        }
    }
    private class LockedException : Exception()
    private fun ensureUnlocked() {
        val keyguard = context.getSystemService(KeyguardManager::class.java)
        if (keyguard.isDeviceLocked || keyguard.isKeyguardLocked) throw LockedException()
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
        return preferences.getString(name, null)?.let { JSONObject(it) }
    }

    override fun getCapabilities(promise: Promise) = operation(promise) {
        JSONObject().put("available", true).toString()
    }

    override fun createCredential(promise: Promise) = operation(promise) {
        ensureUnlocked()
        val keyId = UUID.randomUUID().toString()
        val name = alias(keyId)
        fun generate(strongBox: Boolean) {
            val generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore")
            val builder = KeyGenParameterSpec.Builder(name, KeyProperties.PURPOSE_SIGN)
                .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
                .setDigests(KeyProperties.DIGEST_SHA256)
                .setUserAuthenticationRequired(false)
            if (Build.VERSION.SDK_INT >= 28) builder.setIsStrongBoxBacked(strongBox)
            generator.initialize(builder.build())
            generator.generateKeyPair()
        }
        try {
            val strongBox = Build.VERSION.SDK_INT >= 28 && context.packageManager.hasSystemFeature(PackageManager.FEATURE_STRONGBOX_KEYSTORE)
            if (strongBox && Build.VERSION.SDK_INT >= 28) {
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
        require(challenge.length in 16..1024 && Regex("^[A-Za-z0-9_-]+$").matches(challenge))
        check(read(keyId) != null)
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
        val signer = Signature.getInstance("SHA256withECDSA")
        signer.initSign(store.getKey(name, null) as PrivateKey)
        signer.update(authenticator + sha256(client))
        val signature = signer.sign()
        ensureUnlocked()
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
        executor.shutdown()
        super.invalidate()
    }
}
