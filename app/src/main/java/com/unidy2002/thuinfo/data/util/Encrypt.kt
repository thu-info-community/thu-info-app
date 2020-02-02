package com.unidy2002.thuinfo.data.util

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties.*
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec

private const val KEY_ALGORITHM = KEY_ALGORITHM_AES
private const val BLOCK_MODE = BLOCK_MODE_GCM
private const val ENCRYPTION_PADDING = ENCRYPTION_PADDING_NONE
private const val TRANSFORMATION = "AES/GCM/NoPadding"
private const val ANDROID_KEY_STORE = "AndroidKeyStore"

/**
 * @see <a href="https://github.com/wutongke/KeyStoreDemo">KeyStoreDemo</a>
 * @see <a href="https://blog.csdn.net/pcaxb/article/details/47112245">ByteArray and String</a>
 */

fun encrypt(alias: String, text: String) =
    Cipher.getInstance(TRANSFORMATION).run {
        init(Cipher.ENCRYPT_MODE,
            KeyGenerator.getInstance(
                KEY_ALGORITHM,
                ANDROID_KEY_STORE
            ).run {
                init(
                    KeyGenParameterSpec.Builder(alias, PURPOSE_ENCRYPT or PURPOSE_DECRYPT)
                        .setBlockModes(BLOCK_MODE)
                        .setEncryptionPaddings(ENCRYPTION_PADDING)
                        .build()
                )
                generateKey()
            })
        b2s(iv) to b2s(doFinal(text.toByteArray(StandardCharsets.UTF_8)))
    }

fun decrypt(alias: String, key: Pair<String, String>) =
    Cipher.getInstance(TRANSFORMATION).run {
        init(Cipher.DECRYPT_MODE,
            (KeyStore.getInstance(ANDROID_KEY_STORE).run {
                load(null)
                getEntry(alias, null)
            } as KeyStore.SecretKeyEntry).secretKey,
            GCMParameterSpec(128, s2b(key.first))
        )
        String(doFinal(s2b(key.second)), StandardCharsets.UTF_8)
    }

private fun b2s(byteArray: ByteArray) =
    byteArray.joinToString("") { Integer.toHexString((0xFF and it.toInt())).padStart(2, '0') }

private fun s2b(string: String) =
    string.windowed(2, 2) { it.toString().toInt(16).toByte() }.toByteArray()