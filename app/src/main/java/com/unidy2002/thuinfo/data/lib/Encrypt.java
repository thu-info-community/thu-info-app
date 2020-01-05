package com.unidy2002.thuinfo.data.lib;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Log;

import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.*;

/*
/**
 * @author wutongke
 * @see "https://github.com/wutongke/KeyStoreDemo"
public class Encrypt {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final String ANDROID_KEY_STORE = "AndroidKeyStore";

    private static Cipher cipherEncrypt;
    private static Cipher cipherDecrypt;
    private static KeyStore keyStore;

    public Encrypt(final String alias) throws NoSuchPaddingException, NoSuchAlgorithmException, NoSuchProviderException, InvalidAlgorithmParameterException, InvalidKeyException, UnrecoverableEntryException, KeyStoreException, java.security.cert.CertificateException, IOException {
        cipherEncrypt = Cipher.getInstance(TRANSFORMATION);
        cipherEncrypt.init(Cipher.ENCRYPT_MODE, getSecretKeyForEncrypt(alias));

        keyStore = KeyStore.getInstance(ANDROID_KEY_STORE);
        keyStore.load(null);

        final GCMParameterSpec spec = new GCMParameterSpec(128, cipherEncrypt.getIV());
        cipherDecrypt = Cipher.getInstance(TRANSFORMATION);
        cipherDecrypt.init(Cipher.DECRYPT_MODE, getSecretKeyForDecrypt(alias), spec);
    }

    public byte[] encrypt(final String text) throws BadPaddingException, IllegalBlockSizeException {
        return cipherEncrypt.doFinal(text.getBytes(StandardCharsets.UTF_8));
    }

    public String decrypt(final byte[] data) throws BadPaddingException, IllegalBlockSizeException {
        return new String(cipherDecrypt.doFinal(data), StandardCharsets.UTF_8);
    }

    private SecretKey getSecretKeyForEncrypt(final String alias) throws NoSuchProviderException, NoSuchAlgorithmException, InvalidAlgorithmParameterException {
        final KeyGenerator keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEY_STORE);
        keyGenerator.init(new KeyGenParameterSpec.Builder(alias,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build());
        return keyGenerator.generateKey();
    }

    private SecretKey getSecretKeyForDecrypt(final String alias) throws NoSuchAlgorithmException, UnrecoverableEntryException, KeyStoreException {
        return ((KeyStore.SecretKeyEntry) keyStore.getEntry(alias, null)).getSecretKey();
    }
}*/