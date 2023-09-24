package com.unidy2002.thuinfo

import android.annotation.SuppressLint
import android.app.Application
import android.content.pm.PackageManager
import android.widget.Toast
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
        Toast.makeText(applicationContext, "签名被篡改，禁止运行。", Toast.LENGTH_SHORT).show()
        exitProcess(1)
    }
}

fun Application.preventEmulator() {
    if (!BuildConfig.DEBUG) {
        listOf(
            "/system/lib/libc_malloc_debug_qemu.so",
            "/sys/qemu_trace",
            "/system/bin/qemu-props",
        ).forEach { filename ->
            try {
                if (File(filename).exists()) {
                    Toast.makeText(applicationContext, "禁止在模拟器中运行。", Toast.LENGTH_SHORT).show()
                    exitProcess(2)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}

fun Application.preventRoot() {
    listOf(
        "/system/bin/",
        "/system/xbin/",
        "/system/sbin/",
        "/sbin/",
        "/vendor/bin/"
    ).forEach { path ->
        try {
            if (File("${path}su").exists()) {
                Toast.makeText(applicationContext, "禁止在 Root 设备上运行。", Toast.LENGTH_SHORT).show()
                exitProcess(3)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
