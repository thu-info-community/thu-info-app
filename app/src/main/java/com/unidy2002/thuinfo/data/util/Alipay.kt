package com.unidy2002.thuinfo.data.util

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.network.Network
import org.jsoup.Jsoup
import java.io.BufferedReader
import java.io.InputStreamReader

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

    /**
     * A <del>generalized</del> module for getting pay code from a given requestPayAction url.
     *
     * @param location  the requestPayAction url
     * @param referer   the referer of the first request
     *
     * @return          the corresponding pay code, or null if any exception occurs
     */
    fun Network.generalGetPayCode(location: String, referer: String, report: Boolean = false): String? {
        println(location)
        try {
            // Get pay id
            val id: String
            val xxx: String
            connect(location, referer, loggedInUser.vpnTicket).inputStream.run {
                Jsoup.parse(this, "GBK", location).getElementById("form2").run {
                    id = child(0).attr("value")
                    xxx = child(1).attr("value").replace("=", "%3d")
                }
                close()
            }
            Log.i("pay id", id)
            Log.i("pay xxx", xxx)
            if (Thread.interrupted()) {
                Log.i("interrupt", "get pay code [1]")
                return null
            }

            // For report only
            if (report) {
                connect(
                    "https://webvpn.tsinghua.edu.cn/https/77726476706e69737468656265737421eaff489a327e7c4377068ea48d546d301d731c068b/sfpt/checkPayAction!check.action?vpn-12-o2-zhifu.tsinghua.edu.cn",
                    location,
                    loggedInUser.vpnTicket,
                    "xxx=$xxx"
                ).inputStream.close()
            }

            // Send pay request to alipay
            lateinit var url: String
            lateinit var form: String
            connect(
                "https://webvpn.tsinghua.edu.cn/https/77726476706e69737468656265737421eaff489a327e7c4377068ea48d546d301d731c068b/sfpt/sendToAlipayAction.action",
                referer = location,
                cookie = loggedInUser.vpnTicket,
                post = "id=$id&xxx=$xxx"
            ).inputStream?.run {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                var readLine: String?
                while ((reader.readLine().also { readLine = it }) != null) {
                    if (readLine!!.contains("action=")) {
                        url = readLine!!.run { substring(indexOf("action=") + 8, lastIndexOf("\">")) }
                            .replace("amp;", "")
                        form = reader.readLine()
                            .run { substring(indexOf("value=") + 7, lastIndexOf("\">")) }
                            .replace("{", "%7B")
                            .replace("&quot;", "%22")
                            .replace(":", "%3A")
                            .replace("}", "%7D")
                            .replace(",", "%2C")
                            .replace("清华学生紫荆电表", "%C7%E5%BB%AA%D1%A7%C9%FA%D7%CF%BE%A3%B5%E7%B1%ED")
                        // It simply works... Even with paying to get report... Amazing...
                        break
                    }
                }
                reader.close()
                close()
            }
            Log.i("recharge", "redirect")
            if (Thread.interrupted()) {
                Log.i("interrupt", "get pay code [2]")
                return null
            }

            // Get pay code
            connect(
                "$url&biz_content=$form",
                referer = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff489a327e7c4377068ea48d546d301d731c068b/sfpt/sendToAlipayAction.action",
                cookie = loggedInUser.vpnTicket
            ).inputStream?.run {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                var readLine: String?
                lateinit var payCode: String
                while (reader.readLine().also { readLine = it } != null) {
                    if (readLine!!.contains("<input name=\"qrCode\"")) {
                        payCode = readLine!!.run { substring(indexOf("alipay") + 11) }
                            .run { substring(0, indexOf('"')) }
                        break
                    }
                }
                reader.close()
                close()
                return payCode
            }
            if (Thread.interrupted()) {
                Log.i("interrupt", "get pay code [3]")
                return null
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }
}