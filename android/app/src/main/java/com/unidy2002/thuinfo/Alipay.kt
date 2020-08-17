package com.unidy2002.thuinfo

import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class Alipay(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "Alipay"

    @ReactMethod
    fun exists(promise: Promise) {
        try {
            if (context.packageManager.getPackageInfo("com.eg.android.AlipayGphone", 0) != null)
                promise.resolve(null)
            else
                promise.reject(Exception("Alipay not found on device."))
        } catch (e: Exception) {
            e.printStackTrace()
            promise.reject(e)
        }
    }

    @ReactMethod
    fun pay(payCode: String, promise: Promise) {
        try {
            context.startActivity(
                    Intent.parseUri(
                            "intent://platformapi/startapp?saId=10000007&clientVersion=3.7.0.0718&qrcode=https%3A%2F%2Fqr.alipay.com%2F$payCode%3F_s%3Dweb-other&_t=1472443966571#Intent;scheme=alipayqr;package=com.eg.android.AlipayGphone;end",
                            Intent.URI_INTENT_SCHEME
                    ).also { it.flags = Intent.FLAG_ACTIVITY_NEW_TASK }
            )
            promise.resolve(null)
        } catch (e: Exception) {
            e.printStackTrace()
            promise.reject(e)
        }
    }
}