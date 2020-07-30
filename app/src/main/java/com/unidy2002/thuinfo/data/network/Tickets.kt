package com.unidy2002.thuinfo.data.network

import android.util.Log
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import java.io.BufferedReader
import java.io.InputStreamReader
import java.lang.System.currentTimeMillis
import java.net.URLEncoder.encode

fun Network.getTicket(target: Int) {
    loggedInUser.connectionState[target] = true
    try {
        when (target) {
            -1 -> {
                // Login to tsinghua home
                val id =
                    (currentTimeMillis() * currentTimeMillis() % loggedInUser.userId.hashCode()) * Math.random()
                        .also { Log.d("Random id", it.toString()) }
                val url =
                    "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fdb94c852f3f6555301c9aa596522b20e7a45e0b22fda391/weixin/weixin_user_authenticate.aspx?url=%2fweixin%2fweixin_personal_information.aspx&weixin_appid=$id"
                val encodedPassword = encode(loggedInUser.communityPassword, "UTF-8")
                connect(
                    url,
                    url,
                    loggedInUser.vpnTicket,
                    "__VIEWSTATE=%2FwEPDwUKLTEzNDQzMjMyOGRkBAc4N3HClJjnEWfrw0ASTb%2FU6Ev%2FSwndECOSr8NHmdI%3D&__VIEWSTATEGENERATOR=7FA746C3&__EVENTVALIDATION=%2FwEWBgK41bCLBQKPnvPTAwLXmu9LAvKJ%2FYcHAsSg1PwGArrUlUcttKZxxZPSNTWdfrBVquy6KRkUYY9npuyVR3kB%2BBCrnQ%3D%3D&weixin_user_authenticateCtrl1%24txtUserName=${loggedInUser.userId}&weixin_user_authenticateCtrl1%24txtPassword=$encodedPassword&weixin_user_authenticateCtrl1%24btnLogin=%B5%C7%C2%BC"
                ).inputStream.run {
                    val reader = BufferedReader(InputStreamReader(this, "gb2312"))
                    var readLine: String?
                    while (reader.readLine().also { readLine = it } != null) {
                        if (readLine!!.contains("当前用户认证信息")) {
                            loggedInUser.communityLoggedIn = true
                            return@run
                        }
                    }
                    loggedInUser.communityLoggedIn = false
                }
            }
            in 0..1000 -> {
                connect(
                    "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                    "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/prelogin.jsp?result=1",
                    loggedInUser.vpnTicket
                ).inputStream.run {
                    val reader = BufferedReader(InputStreamReader(this, "GBK"))
                    var readLine: String?
                    try {
                        while (reader.readLine().also { readLine = it } != null) {
                            if (readLine!!.contains("a name=\"9-$target\"")) {
                                readLine!!
                                    .substring(
                                        readLine!!.indexOf("src") + 5, readLine!!.indexOf("\" id=\"9-$target")
                                    )
                                    .replace("amp;", "")
                                    .run {
                                        connect(
                                            this,
                                            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                                            loggedInUser.vpnTicket
                                        ).inputStream.close()
                                        Log.i("TICKET $target", this)
                                    }
                                break
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    } finally {
                        reader.close()
                        close()
                    }
                }
            }
            else -> {
                connect(
                    "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/minichan/roamaction.jsp?mode=local&id=$target",
                    "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/prelogin.jsp?result=1",
                    loggedInUser.vpnTicket
                ).inputStream.close()
                Log.i("TICKET $target", "get")
            }
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
    loggedInUser.connectionState[target] = false
}

fun <R> Network.retryTemplate(target: Int, block: () -> R): R? {
    repeat(3) {
        try {
            if (loggedInUser.connectionState[target] == true) {
                val waitTill = currentTimeMillis() + 800
                while (loggedInUser.connectionState[target] == true)
                    if (currentTimeMillis() >= waitTill)
                        break
            }
            if (loggedInUser.connectionState[target] == false) return block()
        } catch (e: Exception) {
            e.printStackTrace()
            if (loggedInUser.connectionState[target] == false) getTicket(target)
        }
    }
    return null
}

