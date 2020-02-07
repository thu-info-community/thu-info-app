package com.unidy2002.thuinfo.data.util

import android.app.Activity
import android.content.Context
import android.content.Intent

/**
 * @see "https://github.com/didikee/AndroidDonate"
 */
object Alipay {
    /**
     * Start alipay client with the intended pay code.
     *
     * The pay code can be found in the url of the qr code. For example,
     * <code>aeh7yvf4tad18zo6e7</code> in <code>https://qr.alipay.com/aeh7yvf4tad18zo6e7</code>.
     *
     * @param activity  the parent activity
     * @param payCode   the pay code of the target payment
     * @return          true if successfully started alipay client, false if not
     */
    fun startAlipayClient(activity: Activity, payCode: String) =
        try {
            activity.startActivity(
                Intent.parseUri(
                    "intent://platformapi/startapp?saId=10000007&clientVersion=3.7.0.0718&qrcode=https%3A%2F%2Fqr.alipay.com%2F$payCode%3F_s%3Dweb-other&_t=1472443966571#Intent;scheme=alipayqr;package=com.eg.android.AlipayGphone;end",
                    Intent.URI_INTENT_SCHEME
                )
            )
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }

    /**
     * Check whether Alipay has been installed.
     *
     * It is recommended that this be called whenever alipay is to be started.
     *
     * @param context   the context performing the request
     * @return          true if Alipay has been installed, false if not
     */
    fun hasInstalledAlipayClient(context: Context) =
        try {
            context.packageManager.getPackageInfo("com.eg.android.AlipayGphone", 0) != null
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
}