package com.unidy2002.thuinfo.data.network

import android.util.Log
import android.webkit.CookieManager
import com.unidy2002.thuinfo.data.model.login.LoggedInUser
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.URL
import java.net.URLEncoder.encode
import java.nio.charset.StandardCharsets
import javax.net.ssl.HttpsURLConnection

object Network {
    fun connect(
        url: String,
        referer: String? = null,
        cookie: String? = null,
        post: String? = null,
        followRedirects: Boolean = true,
        hole: Boolean = false
    ) = (URL(url).openConnection() as HttpsURLConnection).apply {
        setRequestProperty(
            "User-Agent",
            if (hole) "THUInfo/1.1.2"
            else "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36"
        )
        referer?.run { setRequestProperty("referer", this) }
        cookie?.run { setRequestProperty("cookie", this) }
        instanceFollowRedirects = followRedirects
        post?.run {
            doOutput = true
            requestMethod = "POST"
            OutputStreamWriter(outputStream, StandardCharsets.UTF_8).apply {
                write(this@run)
                flush()
                close()
            }
        }
    }

    fun login(userId: String, password: String) = LoggedInUser(userId, password).apply {
        // Try login to webvpn
        vpnTicket = connect(
            "https://webvpn.tsinghua.edu.cn/do-login?local_login=true",
            "https://webvpn.tsinghua.edu.cn/login",
            post = "auth_type=local&username=$userId&sms_code=&password=${encode(password, "UTF-8")}",
            followRedirects = false
        ).headerFields["Set-Cookie"]!!.joinToString("; ") {
            it.substring(0, it.indexOf(';')).also { cookie ->
                CookieManager.getInstance().setCookie("webvpn.tsinghua.edu.cn", cookie)
            }
        }
        if (Thread.interrupted()) {
            Log.i("interrupt", "login [0]")
            throw InterruptedException()
        }

        // Verify login
        if (!connect("https://webvpn.tsinghua.edu.cn/", "https://webvpn.tsinghua.edu.cn/login", vpnTicket).getData()
                .contains("首页")
        ) throw UserLoginError()
        if (Thread.interrupted()) {
            Log.i("interrupt", "login [1]")
            throw InterruptedException()
        }

        // Login to tsinghua info
        connect(
            "https://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/Login",
            "https://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/",
            vpnTicket,
            "redirect=NO&userName=$userId&password=${encode(password, "UTF-8")}&x=0&y=0"
        ).inputStream.close()
        if (Thread.interrupted()) {
            Log.i("interrupt", "login [2]")
            throw InterruptedException()
        }

        // Invalidate zhjw session
        connect(
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/servlet/InvalidateSession",
            "https://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/",
            vpnTicket
        ).inputStream.close()
        if (Thread.interrupted()) {
            Log.i("interrupt", "login [3]")
            throw InterruptedException()
        }
    }

    fun getUsername() {
        connect(
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/minichan/roamaction.jsp?id=2612",
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/minichan/bks_grzm.jsp",
            loggedInUser.vpnTicket
        ).inputStream.run {
            try {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                var readLine: String?
                try {
                    while (reader.readLine().also { readLine = it } != null) {
                        if (readLine!!.contains("<td class=\"report1_3\">")) {
                            loggedInUser.fullName = readLine!!.substring(
                                readLine!!.indexOf('>') + 1, readLine!!.indexOf("</")
                            )
                            Log.i("Full name", loggedInUser.fullName)
                            break
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                } finally {
                    try {
                        reader.close()
                        close()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun logout() {
        connect(
            "https://webvpn.tsinghua.edu.cn/logout",
            null,
            loggedInUser.vpnTicket
        ).inputStream.close()
    }

    class UserLoginError : Exception()

}

fun HttpsURLConnection.getData(charsetName: String = "UTF-8"): String {
    val reader = BufferedReader(InputStreamReader(inputStream, charsetName))
    val stringBuilder = StringBuilder()
    var readLine: String?
    while (reader.readLine().also { readLine = it } != null)
        stringBuilder.append("$readLine\n")
    reader.close()
    inputStream.close()
    return stringBuilder.toString()
}