package com.unidy2002.thuinfo

import android.annotation.SuppressLint
import android.app.Application
import android.content.pm.PackageManager
import java.io.File
import java.security.MessageDigest
import java.util.Formatter
import kotlin.system.exitProcess

@SuppressLint("PackageManagerGetSignatures")
@Suppress("DEPRECATION")
fun Application.verifySignature() {
    val signature = packageManager.getPackageInfo(
        applicationContext.packageName,
        PackageManager.GET_SIGNATURES,
    ).signatures[0]
    val formatter = Formatter()
    MessageDigest
        .getInstance("SHA-1")
        .digest(signature.toByteArray())
        .forEach { b -> formatter.format("%02x", b) }
    if (!BuildConfig.DEBUG && formatter.toString() != BuildConfig.SIGNATURE_DIGEST) {
        exitProcess(1)
    }
}

fun preventRoot() {
    listOf(
        "/system/bin/",
        "/system/xbin/",
        "/system/sbin/",
        "/sbin/",
        "/vendor/bin/"
    ).forEach { path ->
        try {
            if (File("${path}su").exists()) {
                exitProcess(3)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
