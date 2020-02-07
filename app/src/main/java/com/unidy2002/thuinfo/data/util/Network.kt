package com.unidy2002.thuinfo.data.util

import android.content.Context
import android.util.Log
import android.webkit.CookieManager
import androidx.appcompat.app.AppCompatActivity
import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONObject
import com.unidy2002.thuinfo.data.dao.ScheduleDBManager
import com.unidy2002.thuinfo.data.model.login.LoggedInUser
import com.unidy2002.thuinfo.data.model.news.NewsHTML
import com.unidy2002.thuinfo.data.model.report.ReportItem
import com.unidy2002.thuinfo.data.model.schedule.Schedule
import com.unidy2002.thuinfo.data.model.tables.ECardRecord
import com.unidy2002.thuinfo.data.model.tables.JoggingRecord
import com.unidy2002.thuinfo.ui.login.LoginActivity
import jxl.Workbook
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.lang.System.currentTimeMillis
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.text.SimpleDateFormat
import java.util.*
import javax.net.ssl.HttpsURLConnection

class Network {
    private val loggedInUser: LoggedInUser get() = LoginActivity.loginViewModel.getLoggedInUser()

    private fun <T : HttpURLConnection> connect(
        url: String,
        referer: String? = null,
        cookie: String? = null,
        post: String? = null,
        followRedirects: Boolean = true
    ) = (URL(url).openConnection() as T).apply {
        setRequestProperty(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36"
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

    fun login(loggedInUser: LoggedInUser) {
        // Get vpn ticket
        val cookieManager = CookieManager.getInstance()
        loggedInUser.vpnTicket = connect<HttpsURLConnection>("https://webvpn.tsinghua.edu.cn/login")
            .headerFields["Set-Cookie"]!!
            .joinToString("; ") {
                it.substring(0, it.indexOf(';'))
                    .also { cookie -> cookieManager.setCookie("webvpn.tsinghua.edu.cn", cookie) }
            }
            .also { Log.i("VPN TICKET", it) }

        // Login to webvpn
        connect<HttpsURLConnection>(
            "https://webvpn.tsinghua.edu.cn/do-login?local_login=true",
            "https://webvpn.tsinghua.edu.cn/login",
            loggedInUser.vpnTicket,
            "auth_type=local&username=${loggedInUser.userId}&sms_code=&password=${loggedInUser.password}"
        ).inputStream.run {
            val reader = BufferedReader(InputStreamReader(this))
            var readLine: String?
            while (reader.readLine().also { readLine = it } != null) {
                if (readLine!!.matches(Regex(".*var logoutOtherToken = '.+'.*"))) {
                    readLine = readLine!!.substring(readLine!!.indexOf('\'') + 1)
                    readLine = readLine!!.substring(0, readLine!!.indexOf('\''))
                    connect<HttpsURLConnection>(
                        "https://webvpn.tsinghua.edu.cn/do-confirm-login",
                        "https://webvpn.tsinghua.edu.cn/do-login?local_login=true",
                        loggedInUser.vpnTicket,
                        "username=${loggedInUser.userId}&logoutOtherToken=$readLine"
                    ).inputStream.close()
                    Log.i("KICK", readLine!!)
                } else if (readLine!!.contains("错误")) {
                    throw UserLoginError()
                }
            }
            reader.close()
            close()
        }

        // Login to tsinghua info
        connect<HttpsURLConnection>(
            "https://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/Login",
            "https://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/",
            loggedInUser.vpnTicket,
            "redirect=NO&userName=${loggedInUser.userId}&password=${loggedInUser.password}&x=0&y=0"
        ).inputStream.close()

        // Invalidate zhjw session
        connect<HttpsURLConnection>(
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/servlet/InvalidateSession",
            "https://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/",
            loggedInUser.vpnTicket
        ).inputStream.close()
    }

    fun getUsername() {
        connect<HttpsURLConnection>(
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

    fun getTicket(target: Int) {
        loggedInUser.connectionState[target] = true
        try {
            when (target) {
                -1 -> {
                    // Login to tsinghua home
                    val id =
                        (currentTimeMillis() * currentTimeMillis() % loggedInUser.userId.hashCode()) * Math.random()
                            .also { Log.d("Random id", it.toString()) }
                    val url =
                        "http://m.myhome.tsinghua.edu.cn/weixin/weixin_user_authenticate.aspx?url=%2fweixin%2fweixin_personal_information.aspx&weixin_appid=$id"
                    connect<HttpURLConnection>(url)
                    loggedInUser.communityTicket = connect<HttpURLConnection>(
                        url,
                        url,
                        post = "__VIEWSTATE=%2FwEPDwUKLTEzNDQzMjMyOGRkBAc4N3HClJjnEWfrw0ASTb%2FU6Ev%2FSwndECOSr8NHmdI%3D&__VIEWSTATEGENERATOR=7FA746C3&__EVENTVALIDATION=%2FwEWBgK41bCLBQKPnvPTAwLXmu9LAvKJ%2FYcHAsSg1PwGArrUlUcttKZxxZPSNTWdfrBVquy6KRkUYY9npuyVR3kB%2BBCrnQ%3D%3D&weixin_user_authenticateCtrl1%24txtUserName=${loggedInUser.userId}&weixin_user_authenticateCtrl1%24txtPassword=${loggedInUser.password}&weixin_user_authenticateCtrl1%24btnLogin=%B5%C7%C2%BC",
                        followRedirects = false
                    ).headerFields["Set-Cookie"]?.get(0)?.run { substring(0, indexOf(';')) }
                        ?.also { Log.i("Community ticket", it) }
                        ?: throw Exception("Enter community failed.")
                    connect<HttpURLConnection>(
                        "http://m.myhome.tsinghua.edu.cn/weixin/weixin_personal_information.aspx",
                        url,
                        loggedInUser.communityTicket
                    ).inputStream.run {
                        val reader = BufferedReader(InputStreamReader(this, "gb2312"))
                        var readLine: String?
                        while (reader.readLine().also { readLine = it } != null) {
                            if (readLine!!.contains("楼号"))
                                loggedInUser.dormitory = readLine!!.run { substring(indexOf('>') + 1, indexOf("</")) }
                                    .also { Log.i("Dormitory", it) }
                        }
                    }
                }
                else -> {
                    connect<HttpsURLConnection>(
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
                                            connect<HttpsURLConnection>(
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
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        loggedInUser.connectionState[target] = false
    }

    private fun <R> retryTemplate(target: Int, block: () -> R): R? {
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

    fun getReport(): List<ReportItem>? =
        retryTemplate(792) {
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/cj.cjCjbAll.do?m=bks_cjdcx&cjdlx=zw",
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                loggedInUser.vpnTicket
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                val stringBuilder = StringBuilder()
                var readLine: String?
                while (reader.readLine().also { readLine = it } != null) {
                    stringBuilder.append(readLine).append('\n')
                }
                reader.close()
                close()

                fun nullIfNA(string: String): String? = if (string.matches(Regex("\\*+|N/A"))) null else string

                Jsoup.parse(stringBuilder.toString()).getElementById("table1").child(0).children().drop(1).map {
                    ReportItem(
                        it.child(1).ownText(),
                        it.child(2).ownText().toInt(),
                        nullIfNA(it.child(3).ownText()),
                        nullIfNA(it.child(4).ownText())?.toDouble(),
                        it.child(5).ownText()
                    )
                }.sortedBy {
                    when (it.semester[5]) {
                        '夏' -> 0
                        '秋' -> 1
                        '春' -> 2
                        else -> 3
                    }
                }
            }
        }

    fun getPhysicalExamResult(): Map<String, String?>? =
        retryTemplate(792) {
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/tyjx.tyjx_tc_xscjb.do?vpn-12-o1-zhjw.cic.tsinghua.edu.cn&m=jsonCj",
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/tyjx.tyjx_tc_xscjb.do?m=tc_bkscjcx",
                loggedInUser.vpnTicket
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                val stringBuilder = StringBuilder()
                var readLine: String?
                while (reader.readLine().also { readLine = it } != null)
                    stringBuilder.append(readLine!!)

                val json = JSON.parse(stringBuilder.toString().drop(1).dropLast(1)) as JSONObject
                if (json.getString("success") == "false")
                    null
                else {
                    mutableMapOf<String, String?>(
                        "是否免测" to "sfmc",
                        "免测原因" to "mcyy",
                        "总分" to "zf",
                        "标准分" to "bzf",
                        "附加分" to "fjf",
                        "长跑附加分" to "cpfjf",
                        "身高" to "sg",
                        "体重" to "tz",
                        "身高体重分数" to "sgtzfs",
                        "肺活量" to "fhl",
                        "肺活量分数" to "fhltzfs",
                        "800M跑" to "bbmp",
                        "800M跑分数" to "bbmpfs",
                        "1000M跑" to "yqmp",
                        "1000M跑分数" to "yqmpfs",
                        "50M跑" to "wsmp",
                        "50M跑分数" to "wsmpfs",
                        "立定跳远" to "ldty",
                        "立定跳远分数" to "ldtyfs",
                        "坐位体前屈" to "zwtqq",
                        "坐位体前屈分数" to "zwtqqfs",
                        "仰卧起坐" to "ywqz",
                        "仰卧起坐分数" to "ywqzfs",
                        "引体向上" to "ytxs",
                        "引体向上分数" to "ytxsfs",
                        "体育课成绩" to "tykcj"
                    )
                }
            }
        }

    fun getJoggingRecord(): List<JoggingRecord>? =
        retryTemplate(792) {
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/tyjx.tyjx_kw_xscjb.do?m=queryXsCjAll",
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/jxmh.do?url=jxmh.do&m=bks_tyjx_tcyy",
                loggedInUser.vpnTicket
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                val stringBuilder = StringBuilder()
                var readLine: String?
                while (reader.readLine().also { readLine = it } != null)
                    stringBuilder.append(readLine!!).append('\n')

                Jsoup.parse(stringBuilder.toString()).getElementsByClass("table_list")[0].child(0).children()
                    .drop(1)
                    .map {
                        JoggingRecord(
                            it.child(0).ownText(),
                            it.child(4).ownText().toInt(),
                            it.child(5).ownText().toInt(),
                            it.child(6).ownText().toInt()
                        )
                    }
            }
        }

    fun getClassroomState(classroom: String, week: Int): List<Pair<String, List<Int>>>? =
        retryTemplate(792) {
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/pk.classroomctrl.do?m=qyClassroomState&classroom=$classroom&weeknumber=$week",
                null,
                loggedInUser.vpnTicket
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                var readLine: String?
                val stringBuilder = StringBuilder()
                while (reader.readLine().also { readLine = it } != null)
                    stringBuilder.append(readLine).append('\n')

                fun mapClassName(element: Element) =
                    with(element.classNames().apply { remove("colBound") }) {
                        when (this.size) {
                            0 -> 5
                            1 ->
                                when (this.first()) {
                                    "onteaching" -> 1
                                    "onexam" -> 2
                                    "onborrowed" -> 3
                                    "ondisabled" -> 4
                                    else -> 0
                                }
                            else -> 0
                        }
                    }

                Jsoup.parse(stringBuilder.toString()).getElementById("scrollContent").child(0).children()
                    .flatMap { it.children() }
                    .map { (it.child(0).textNodes()[1].text() to it.children().drop(1).map(::mapClassName)) }
            }
        }

    fun getWentuState(): List<Pair<String, Pair<Int, Int>>> =
        try {
            Jsoup.parse(URL("http://seat.lib.tsinghua.edu.cn/roomshow/"), 6000).body().child(0)
                .child(2).child(0).child(0).children().drop(3).map {
                    it.child(0).text() to
                            (it.child(1).text().toInt() to it.child(2).text().toInt())
                }
        } catch (e: Exception) {
            e.printStackTrace()
            listOf()
        }

    fun getECard(): ECardRecord? =
        retryTemplate(824) {
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a/user/ExDetailsDown.do",
                null,
                loggedInUser.vpnTicket
            ).inputStream.run {
                val sheet = Workbook.getWorkbook(this).getSheet(0)
                val rowCount = sheet.rows
                val table = ECardRecord()
                for (i in rowCount - 2 downTo 1) {
                    with(sheet.getRow(i)) {
                        table.addElement(
                            this[1].contents,
                            this[2].contents,
                            this[4].contents,
                            this[5].contents.toDouble()
                        )
                    }
                }
                close()
                table
            }
        }

    fun loseCard(): Int? =
        retryTemplate(824) {
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a/user/RambleConsumeLog.do?losscard=true",
                null,
                loggedInUser.vpnTicket
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this))
                var readLine: String?
                while (reader.readLine().also { readLine = it } != null) {
                    if (readLine!!.contains("var result")) {
                        readLine = readLine!!.substring(readLine!!.indexOf('=') + 1).trim()
                        return@run if (readLine == "null") null else readLine?.toInt()
                    }
                }
                null
            }
        }

    fun getPrettyPrintHTML(url: String): NewsHTML? =
        try {
            Jsoup.connect(url).cookies(
                loggedInUser.vpnTicket.split("; ").mapNotNull {
                    with(it.split('=')) { if (size == 2) this[0] to this[1] else null }
                }.toMap()
            ).get().run {
                when {
                    url.contains("jwcbg") ->
                        body().child(1).child(0).child(0).child(0).child(0).run {
                            NewsHTML(
                                child(2).child(0).child(0).text(),
                                child(4).child(0).child(0).child(0).child(1)
                                    .child(0).child(1).child(0).child(1).child(0)
                                    .child(0).child(0).children()
                            )
                        }
                    url.contains("kybg") ->
                        body().child(2).child(0).child(0).child(1).child(3).child(0).run {
                            NewsHTML(
                                child(0).text(),
                                child(1).child(0).children()
                            )
                        }
                    url.contains("gjc") ->
                        body().child(1).child(0).child(0).child(0).child(1).child(0)
                            .child(4).child(0).child(0).child(0).child(0).child(0).run {
                                NewsHTML(
                                    child(1).text(),
                                    children().drop(2).dropLast(1)
                                )
                            }
                    url.contains("77726476706e69737468656265737421e8ef439b69336153301c9aa596522b20e1a870705b76e399") ->
                        NewsHTML(
                            "",
                            select("td.td4").first().children()
                        )
                    url.contains("77726476706e69737468656265737421e9fd528569336153301c9aa596522b20735d12f268e561f0") ->
                        getElementById("center").run {
                            NewsHTML(
                                child(1).text(),
                                child(3).child(0).children()
                            )
                        }
                    url.contains("77726476706e69737468656265737421e0f852882e3e6e5f301c9aa596522b2043f84ba24ebecaf8") ->
                        select("div.cont_doc_box").first().run {
                            NewsHTML(
                                child(0).child(0).text(),
                                child(1).children()
                            )
                        }
                    url.contains("77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3") ->
                        body().child(1).child(0).child(0).child(0).child(0).child(0)
                            .child(0).child(0).child(0).run {
                                NewsHTML(
                                    child(2).child(0).child(0).child(0).text(),
                                    child(3).child(0).child(0).child(0).children()
                                )
                            }
                    url.contains("77726476706e69737468656265737421f8e60f8834396657761d88e29d51367b523e") ->
                        select("section.r_cont").first().run {
                            NewsHTML(
                                child(2).text(),
                                child(4).children()
                            )
                        }
                    url.contains("fgc") ->
                        getElementById("content2").child(0).run {
                            NewsHTML(
                                child(2).text(),
                                child(3).child(0).child(0).children().drop(1)
                            )
                        }
                    url.contains("rscbg") ->
                        body().child(1).child(0).child(0).child(1).child(0).child(0)
                            .child(2).child(0).child(0).child(0).child(0).child(0).run {
                                NewsHTML(
                                    child(0).text(),
                                    child(1).child(0).child(2).child(0).children()
                                )
                            }
                    url.contains("77726476706e69737468656265737421e7e056d234297b437c0bc7b88b5c2d3212b31e4d37621d4714d6") ->
                        NewsHTML(
                            "",
                            select("div.main").first().child(0).children()
                        )
                    url.contains("ghxt") ->
                        body().child(2).child(0).child(1).child(0).child(0).child(0).run {
                            NewsHTML(
                                child(1).text(),
                                child(4).child(0).child(0).child(0).children()
                            )
                        }
                    url.contains("eleres") ->
                        select("table.bulletTable").first().child(0).run {
                            NewsHTML(
                                child(0).child(1).text(),
                                child(1).child(1).child(0).child(0).child(0).child(0).children()
                            )
                        }
                    url.contains("77726476706e69737468656265737421e8e442d23323615e79009cadd6502720f9b87b") ->
                        select("div.xm-con").first().run {
                            NewsHTML(
                                child(1).text(),
                                child(3).children()
                            )
                        }
                    url.contains("jdbsc") ->
                        body().child(2).child(0).child(0).child(2).child(0).child(0)
                            .child(0).child(0).child(0).run {
                                NewsHTML(
                                    child(0).child(0).child(1).text(),
                                    child(1).child(0).child(0).child(0).children()
                                )
                            }
                    url.contains("77726476706e69737468656265737421e3f5468534367f1e6d119aafd641303ceb8f9190006d6afc78336870") ->
                        throw Exception("招标招租")
                    else ->
                        NewsHTML("", listOf(body().also { if (text().trim().isEmpty()) throw Exception() }))
                }
            }
        } catch (e: Exception) {
            if (e.message != "招标招租")
                e.printStackTrace()
            null
        }

    @Synchronized
    fun getSchedule(context: Context?, force: Boolean = false) = try {
        if (!loggedInUser.scheduleInitialized() || force) {
            ScheduleDBManager.getInstance(context).run {
                val sharedPreferences =
                    context?.getSharedPreferences(loggedInUser.userId, AppCompatActivity.MODE_PRIVATE)
                (if (!force && sharedPreferences?.getBoolean("schedule", false) == true) {
                    Schedule(lessonList, examList, autoShortenMap, customShortenMap, colorMap)
                } else {
                    retryTemplate(792) {
                        val simpleDateFormat = SimpleDateFormat("yyyyMMdd", Locale.CHINA)
                        val data = (0..5).joinToString(",") {
                            connect<HttpsURLConnection>(
                                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/jxmh_out.do?m=bks_jxrl_all&p_start_date=${simpleDateFormat.format(
                                    SchoolCalendar(it * 3 + 1, 1).timeInMillis
                                )}&p_end_date=${simpleDateFormat.format(
                                    SchoolCalendar(it * 3 + 3, 7).timeInMillis
                                )}&jsoncallback=m",
                                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                                loggedInUser.vpnTicket
                            ).inputStream.run {
                                val reader = BufferedReader(InputStreamReader(this))
                                val stringBuilder = StringBuilder()
                                var readLine: String?
                                while (reader.readLine().also { line -> readLine = line } != null)
                                    stringBuilder.append(readLine)
                                reader.close()
                                close()
                                stringBuilder.run { substring(indexOf('[') + 1, lastIndexOf(']')) }
                            }
                        }
                        Schedule(
                            "[$data]",
                            if (loggedInUser.scheduleInitialized())
                                loggedInUser.schedule.customShortenMap
                            else
                                mutableMapOf()
                        ).also {
                            updateLesson(it.lessonList)
                            updateExam(it.examList)
                            updateAuto(it.autoShortenMap)
                            updateColor(it.colorMap)
                            sharedPreferences?.edit()?.putBoolean("schedule", true)?.apply()
                        }
                    }
                })?.also { loggedInUser.schedule = it }
            }
        } else {
            loggedInUser.schedule
        }
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }

    fun getDormScore(): String? =
        retryTemplate(-1) {
            connect<HttpURLConnection>(
                "http://m.myhome.tsinghua.edu.cn/weixin/weixin_health_linechart.aspx?id=0",
                "http://m.myhome.tsinghua.edu.cn/weixin/index.aspx",
                loggedInUser.communityTicket
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this, "gb2312"))
                var readLine: String?
                while (reader.readLine().also { readLine = it } != null) {
                    if (readLine!!.contains("Chart1"))
                        return@run readLine!!.run {
                            "http://m.myhome.tsinghua.edu.cn" + substring(
                                indexOf("src=") + 5,
                                indexOf("\" alt=")
                            )
                        }.also { Log.i("Dorm score", it) }
                }
                null
            }
        }

    @Synchronized
    fun getEleRechargePayCode(money: Int): String? {
        try {
            // Login to tsinghua home website
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fdee49932a3526446d0187ab9040227bca90a6e14cc9/default.aspx",
                cookie = loggedInUser.vpnTicket,
                post = "__VIEWSTATE=%2FwEPDwUJNTYwODM0NTkzD2QWAgIDD2QWIgIDD2QWAgICDxYCHgdWaXNpYmxlaGQCBw9kFgJmDxYCHgtfIUl0ZW1Db3VudAIKFhQCAQ9kFgQCAQ9kFgJmDxUDBDQwNzQn5YWz5LqO5a2m5aCC6LCD5pW06Ieq5Lmg5pe26Ze055qE6YCa55%2BlJ%2BWFs%2BS6juWtpuWgguiwg%2BaVtOiHquS5oOaXtumXtOeahOmAmuefpWQCAw9kFgJmDxUBBTAxLTMxZAICD2QWBAIBD2QWAmYPFQMENDA3MzrlhbPkuo7lu7bplb8yMDIw5bm05a%2BS5YGH5a2m55Sf6ZuG5Lit5L2P5a6%2F5bel5L2c55qE6YCa55%2BlK%2BWFs%2BS6juW7tumVvzIwMjDlubTlr5LlgYflrabnlJ%2Fpm4bkuK3kvY8uLi5kAgMPZBYCZg8VAQUwMS0zMGQCAw9kFgQCAQ9kFgJmDxUDBDQwNzIz5YWz5LqO5a2m55Sf5YWs5a%2BT5oGi5aSN5L6b5bqU5reL5rW054Ot5rC055qE6YCa55%2BlM%2BWFs%2BS6juWtpueUn%2BWFrOWvk%2BaBouWkjeS%2Bm%2BW6lOa3i%2Ba1tOeDreawtOeahOmAmi4uLmQCAw9kFgJmDxUBBTAxLTI4ZAIED2QWBAIBD2QWAmYPFQMENDA3MS3lhbPkuo7mmoLlgZzov5TmoKHlkIzlrabkvY%2Flrr%2FlronmjpLnmoTpgJrnn6Ut5YWz5LqO5pqC5YGc6L%2BU5qCh5ZCM5a2m5L2P5a6%2F5a6J5o6S55qE6YCa55%2BlZAIDD2QWAmYPFQEFMDEtMjdkAgUPZBYEAgEPZBYCZg8VAwQ0MDY2LOaJqeaVo%2BWRqOefpe%2B8gemYsuiMg%2BaWsOWei%2BiCuueCjjQ45a2X5a6I5YiZLOaJqeaVo%2BWRqOefpe%2B8gemYsuiMg%2BaWsOWei%2BiCuueCjjQ45a2X5a6I5YiZZAIDD2QWAmYPFQEFMDEtMjNkAgYPZBYEAgEPZBYCZg8VAwQ0MDY0Q%2BWtpueUn%2BWMuuWVhuaIt%2B%2B8iOWQq%2BW%2Fq%2BmAkueCue%2B8iTIwMjDlubTlr5LlgYfmnJ%2Fpl7TmrYfkuJrml7bpl7Tooagr5a2m55Sf5Yy65ZWG5oi377yI5ZCr5b%2Br6YCS54K577yJMjAyMOW5tC4uLmQCAw9kFgJmDxUBBTAxLTE1ZAIHD2QWBAIBD2QWAmYPFQMENDA2M3%2FlhbPkuo7ovazlj5HjgIrljJfkuqzluILmrovnlr7kurrogZTlkIjkvJog5YyX5Lqs5biC5pWZ6IKy5aeU5ZGY5Lya5YWz5LqO5YGa5aW95q6L55a%2B5a2m55Sf6L6F5Yqp5Zmo5YW36YCC6YWN5bel5L2c55qE6YCa55%2Bl44CLMeWFs%2BS6jui9rOWPkeOAiuWMl%2BS6rOW4guaui%2BeWvuS6uuiBlOWQiOS8miDljJcuLi5kAgMPZBYCZg8VAQUwMS0xMGQCCA9kFgQCAQ9kFgJmDxUDBDQwNjIq5YWz5LqO5YWs5YWx5pWZ5a2m5qW85a%2BS5YGH6Zet6aaG55qE5YWs5ZGKKuWFs%2BS6juWFrOWFseaVmeWtpualvOWvkuWBh%2BmXremmhueahOWFrOWRimQCAw9kFgJmDxUBBTAxLTA5ZAIJD2QWBAIBD2QWAmYPFQMENDA2MSTph43opoHpgJrnn6XvvIjmtojpmLLmtYvor5XpgJrnn6XvvIkk6YeN6KaB6YCa55%2Bl77yI5raI6Ziy5rWL6K%2BV6YCa55%2Bl77yJZAIDD2QWAmYPFQEFMDEtMDhkAgoPZBYEAgEPZBYCZg8VAwQ0MDYwMOavleS4mueUn%2Bemu%2BagoeS5i%2BmAgOWuv%2BebuOWFs%2BW4uOingemXrumimOmXruetlDDmr5XkuJrnlJ%2FnprvmoKHkuYvpgIDlrr%2Fnm7jlhbPluLjop4Hpl67popjpl67nrZRkAgMPZBYCZg8VAQUwMS0wMmQCCQ9kFgJmDxYCHwECChYUAgEPZBYIAgEPZBYCZg8VAxRjNWE1YzQ5NDc1NDEzMWEwNzEyMDzlj43lr7nlsIblt7Lnu4%2Flh7rpmpTnprvmnJ%2FnmoTlkIzlrabku6zkuIDliIDliIfpm4bkuK3kvY%2Flrr8t5Y%2BN5a%2B55bCG5bey57uP5Ye66ZqU56a75pyf55qE5ZCM5a2m5Lus5LiALi4uZAICDxUBATBkAgMPZBYCZg8VAQUwMi0wNmQCBA8VASE8Zm9udCBjb2xvcj0jOTQyNjYwPuacquetlDwvZm9udD5kAgIPZBYIAgEPZBYCZg8VAxRkNWE1YzQ5NDc1NDEzMWEwNzEyMD7ntKvojYYxN%2BeDreawtOW%2BiOWHie%2B8jOaUvuawtOW%2BiOS5heS%2BneeEtuW%2BiOWHieOAguOAguOAguOAguOAginntKvojYYxN%2BeDreawtOW%2BiOWHie%2B8jOaUvuawtOW%2BiOS5heS%2BnS4uLmQCAg8VAQEwZAIDD2QWAmYPFQEFMDItMDZkAgQPFQEhPGZvbnQgY29sb3I9Izk0MjY2MD7mnKrnrZQ8L2ZvbnQ%2BZAIDD2QWCAIBD2QWAmYPFQMUZTVhNWM0OTQ3NTQxMzFhMDcxMjAUMzDlj7fmpbzmmpbmsJTkuI3otrMUMzDlj7fmpbzmmpbmsJTkuI3otrNkAgIPFQEBMGQCAw9kFgJmDxUBBTAyLTA2ZAIEDxUBITxmb250IGNvbG9yPSM5NDI2NjA%2B5pyq562UPC9mb250PmQCBA9kFggCAQ9kFgJmDxUDFGY1YTVjNDk0NzU0MTMxYTA3MTIwJ%2BmZhOiuru%2B8muahg%2BadjuWbreiPnOWPr%2BWQpuWkmuWKoOS4gOS6myfpmYTorq7vvJrmoYPmnY7lm63oj5zlj6%2FlkKblpJrliqDkuIDkuptkAgIPFQEBMGQCAw9kFgJmDxUBBTAyLTA1ZAIEDxUBITxmb250IGNvbG9yPSM5NDI2NjA%2B5pyq562UPC9mb250PmQCBQ9kFggCAQ9kFgJmDxUDFDY1NTVjNDk0NzU0MTMxYTA3MTIwS%2BaIkeS7rOaDs%2BefpemBk%2Ba4heWNjuatpOaXtuWPiuS7peWQjuWcqOagoeW4iOeUn%2BehruiviueWkeS8vOeahOWFt%2BS9k%2BaVsOebri3miJHku6zmg7Pnn6XpgZPmuIXljY7mraTml7blj4rku6XlkI7lnKjmoKEuLi5kAgIPFQEBMGQCAw9kFgJmDxUBBTAyLTA1ZAIEDxUBITxmb250IGNvbG9yPSM5NDI2NjA%2B5pyq562UPC9mb250PmQCBg9kFggCAQ9kFgJmDxUDFDc1NTVjNDk0NzU0MTMxYTA3MTIwFeWMu%2BWtpumZoueuoeeQhuS4jeS4pRXljLvlrabpmaLnrqHnkIbkuI3kuKVkAgIPFQEBMmQCAw9kFgJmDxUBBTAyLTA1ZAIEDxUBITxmb250IGNvbG9yPSM5NDI2NjA%2B5pyq562UPC9mb250PmQCBw9kFggCAQ9kFgJmDxUDFDg1NTVjNDk0NzU0MTMxYTA3MTIwHuahg%2BadjuWbreiPnOWPr%2BWQpuWkmuWKoOS4gOS6mx7moYPmnY7lm63oj5zlj6%2FlkKblpJrliqDkuIDkuptkAgIPFQEBMWQCAw9kFgJmDxUBBTAyLTA0ZAIEDxUBITxmb250IGNvbG9yPSM5NDI2NjA%2B5pyq562UPC9mb250PmQCCA9kFggCAQ9kFgJmDxUDFDk1NTVjNDk0NzU0MTMxYTA3MTIwLeWPr%2BWQpuWRiuefpeWHoOWPt%2BWJjeeahOeBq%2Bi9puelqOWPr%2BS7pemAgO%2B8ny3lj6%2FlkKblkYrnn6Xlh6Dlj7fliY3nmoTngavovabnpajlj6%2Fku6XpgIAuLi5kAgIPFQEBMWQCAw9kFgJmDxUBBTAyLTA0ZAIEDxUBITxmb250IGNvbG9yPSM5NDI2NjA%2B5pyq562UPC9mb250PmQCCQ9kFggCAQ9kFgJmDxUDFGE1NTVjNDk0NzU0MTMxYTA3MTIwQuWuv%2BiIjealvOi%2Fm%2BWHuueZu%2BiusOWFseeUqOeslOS4jeWuieWFqO%2B8jOW6lOivpeeUseS%2FneWuieadpeWhq%2BWGmS3lrr%2FoiI3mpbzov5vlh7rnmbvorrDlhbHnlKjnrJTkuI3lronlhajvvIwuLi5kAgIPFQEBMGQCAw9kFgJmDxUBBTAyLTA0ZAIEDxUBITxmb250IGNvbG9yPSMxMjYyMTg%2B5bey562UPC9mb250PmQCCg9kFggCAQ9kFgJmDxUDFGI1NTVjNDk0NzU0MTMxYTA3MTIwFemjn%2BWggueahOWAvOePree7j%2BeQhhXpo5%2FloILnmoTlgLznj63nu4%2FnkIZkAgIPFQEBMGQCAw9kFgJmDxUBBTAyLTAzZAIEDxUBITxmb250IGNvbG9yPSM5NDI2NjA%2B5pyq562UPC9mb250PmQCCw9kFgJmDxYCHwECDBYYAgEPZBYCZg8VBkRodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9uZXR3ZWJfYnVpbGRpbmcvQnVpbGRpbmdBZHZpY2VBZGQuYXNweAzmiJHmib7mpbzplb84aHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy9JbWFnZS90YWIxLzA4Ni5naWZEaHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbmV0d2ViX2J1aWxkaW5nL0J1aWxkaW5nQWR2aWNlQWRkLmFzcHgM5oiR5om%2B5qW86ZW%2FAGQCAg9kFgJmDxUGLC9OZXR3ZWJfTGlzdC9uZXR3ZWJfcmVwYWlyc3JlY29yZF9Nb250aC5hc3B4DOe9keS4iuaKpeS%2FrjhodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL0ltYWdlL3RhYjEvMTA2LmdpZiwvTmV0d2ViX0xpc3QvbmV0d2ViX3JlcGFpcnNyZWNvcmRfTW9udGguYXNweAznvZHkuIrmiqXkv64AZAIDD2QWAmYPFQYaL25ldHdlYl91c2VyL3JlY2hhcmdlLmFzcHgM5r6h5rC05YWF5YC8OWh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vSW1hZ2UvdGFiMS90aW1nLmpwZxovbmV0d2ViX3VzZXIvcmVjaGFyZ2UuYXNweAzmvqHmsLTlhYXlgLwAZAIED2QWAmYPFQY7aHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbmV0d2ViX3VzZXIvcmVjaGFyZ2VfZWxlLmFzcHgM55S16LS55YWF5YC8O2h0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vSW1hZ2UvdGFiMS90aW1nMTEuanBnO2h0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL25ldHdlYl91c2VyL3JlY2hhcmdlX2VsZS5hc3B4DOeUtei0ueWFheWAvABkAgUPZBYCZg8VBi4vTmV0d2ViX0xpc3QvTmV0d2ViX0hvbWVfUG9zdGJveF9MaXN0TW9yZS5odG1sDOmCruadoeafpeecizhodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL0ltYWdlL3RhYjEvMDk0LmdpZi4vTmV0d2ViX0xpc3QvTmV0d2ViX0hvbWVfUG9zdGJveF9MaXN0TW9yZS5odG1sDOmCruadoeafpeeciwBkAgYPZBYCZg8VBh1odHRwOi8vODUwMDEudHNpbmdodWEuZWR1LmNuLwznlLXor53mn6Xor6I4aHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy9JbWFnZS90YWIxLzA5Mi5naWYdaHR0cDovLzg1MDAxLnRzaW5naHVhLmVkdS5jbi8M55S16K%2Bd5p%2Bl6K%2BiAGQCBw9kFgJmDxUGLC9uZXR3ZWJfY2xhc3Nyb29tL05ldHdlYl9DbGFzc1Jvb21fbGlzdC5odG1sDOaVmeWupOafpeivojhodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL0ltYWdlL3RhYjEvMDg2LmdpZiwvbmV0d2ViX2NsYXNzcm9vbS9OZXR3ZWJfQ2xhc3NSb29tX2xpc3QuaHRtbAzmlZnlrqTmn6Xor6IAZAIID2QWAmYPFQYnL05ldHdlYl9MaXN0L05ldFdlYl9JQ19BcHBsaWNhdGlvbi5hc3B4COWFrOS6pElDOGh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vSW1hZ2UvdGFiMS8xMjguZ2lmJy9OZXR3ZWJfTGlzdC9OZXRXZWJfSUNfQXBwbGljYXRpb24uYXNweAjlhazkuqRJQwBkAgkPZBYCZg8VBiIvTmV0d2ViX0xpc3QvTmV0d2ViX1ZvdGVfSW5mby5odG1sDOaKleelqOiwg%2BafpT1odHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL0ltYWdlL3RhYjEvNjQ0MTA2MDAuZ2lmIi9OZXR3ZWJfTGlzdC9OZXR3ZWJfVm90ZV9JbmZvLmh0bWwM5oqV56Wo6LCD5p%2BlAGQCCg9kFgJmDxUGJy9OZXR3ZWJfTGlzdC9OZXR3ZWJfSG9tZV9Mb3NlX0xpc3QuaHRtbAzlpLHnianlkK%2Fkuos4aHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy9JbWFnZS90YWIxLzAxMy5naWYnL05ldHdlYl9MaXN0L05ldHdlYl9Ib21lX0xvc2VfTGlzdC5odG1sDOWkseeJqeWQr%2BS6iwBkAgsPZBYCZg8VBi0vTmV0d2ViX0xpc3QvTmV0d2ViX0hvbWVfUGlja3VwX0luZm9Nb3JlLmh0bWwM5oub6aKG5ZCv5LqLOGh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vSW1hZ2UvdGFiMS8wOTAuZ2lmLS9OZXR3ZWJfTGlzdC9OZXR3ZWJfSG9tZV9QaWNrdXBfSW5mb01vcmUuaHRtbAzmi5vpooblkK%2FkuosAZAIMD2QWAmYPFQYwL2Vfc2F0aS9TdXJ2ZXlDb21wbGV0ZWRBZGRZaW4uYXNweD9jb2RlPTExMiZpZD0xCea7oeaEj%2BW6pjhodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL0ltYWdlL3RhYjEvMTI5LmdpZjAvZV9zYXRpL1N1cnZleUNvbXBsZXRlZEFkZFlpbi5hc3B4P2NvZGU9MTEyJmlkPTEJ5ruh5oSP5bqmJjxhIGhyZWY9JyMnIHRhcmdldD0nX2JsYW5rJz4%2BPk1vcmU8L2E%2BZAIND2QWAmYPFgIfAQIMFhgCAQ9kFgJmDxUGRGh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL25ldHdlYl9idWlsZGluZy9CdWlsZGluZ0FkdmljZUFkZC5hc3B4DOaIkeaJvualvOmVvzhodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL0ltYWdlL3RhYjEvMDg2LmdpZkRodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9uZXR3ZWJfYnVpbGRpbmcvQnVpbGRpbmdBZHZpY2VBZGQuYXNweAzmiJHmib7mpbzplb8AZAICD2QWAmYPFQYsL05ldHdlYl9MaXN0L25ldHdlYl9yZXBhaXJzcmVjb3JkX01vbnRoLmFzcHgM572R5LiK5oql5L%2BuOGh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vSW1hZ2UvdGFiMS8xMDYuZ2lmLC9OZXR3ZWJfTGlzdC9uZXR3ZWJfcmVwYWlyc3JlY29yZF9Nb250aC5hc3B4DOe9keS4iuaKpeS%2FrgBkAgMPZBYCZg8VBi4vTmV0d2ViX0xpc3QvTmV0d2ViX0hvbWVfUG9zdGJveF9MaXN0TW9yZS5odG1sDOmCruadoeafpeecizhodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL0ltYWdlL3RhYjEvMDk0LmdpZi4vTmV0d2ViX0xpc3QvTmV0d2ViX0hvbWVfUG9zdGJveF9MaXN0TW9yZS5odG1sDOmCruadoeafpeeciwBkAgQPZBYCZg8VBiwvbmV0d2ViX2NsYXNzcm9vbS9OZXR3ZWJfQ2xhc3NSb29tX2xpc3QuaHRtbAzmlZnlrqTmn6Xor6I4aHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy9JbWFnZS90YWIxLzA4Ni5naWYsL25ldHdlYl9jbGFzc3Jvb20vTmV0d2ViX0NsYXNzUm9vbV9saXN0Lmh0bWwM5pWZ5a6k5p%2Bl6K%2BiAGQCBQ9kFgJmDxUGHWh0dHA6Ly84NTAwMS50c2luZ2h1YS5lZHUuY24vDOeUteivneafpeivojhodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL0ltYWdlL3RhYjEvMDkyLmdpZh1odHRwOi8vODUwMDEudHNpbmdodWEuZWR1LmNuLwznlLXor53mn6Xor6IAZAIGD2QWAmYPFQYrL25ldHdlYl9zZXJ2aWNlL05ldHdlYl9Ib21lX0NhbXB1c19CdXMuYXNweAzmoKHlm63kuqTpgJo6aHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy9JbWFnZS90YWIxLzIyMDYwLmpwZysvbmV0d2ViX3NlcnZpY2UvTmV0d2ViX0hvbWVfQ2FtcHVzX0J1cy5hc3B4DOagoeWbreS6pOmAmgBkAgcPZBYCZg8VBicvTmV0d2ViX0xpc3QvTmV0V2ViX0lDX0FwcGxpY2F0aW9uLmFzcHgI5YWs5LqkSUM4aHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy9JbWFnZS90YWIxLzEyOC5naWYnL05ldHdlYl9MaXN0L05ldFdlYl9JQ19BcHBsaWNhdGlvbi5hc3B4COWFrOS6pElDAGQCCA9kFgJmDxUGIi9OZXR3ZWJfTGlzdC9OZXR3ZWJfVm90ZV9JbmZvLmh0bWwM5oqV56Wo6LCD5p%2BlPWh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vSW1hZ2UvdGFiMS82NDQxMDYwMC5naWYiL05ldHdlYl9MaXN0L05ldHdlYl9Wb3RlX0luZm8uaHRtbAzmipXnpajosIPmn6UAZAIJD2QWAmYPFQYnL05ldHdlYl9MaXN0L05ldHdlYl9Ib21lX0xvc2VfTGlzdC5odG1sDOWkseeJqeWQr%2BS6izhodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL0ltYWdlL3RhYjEvMDEzLmdpZicvTmV0d2ViX0xpc3QvTmV0d2ViX0hvbWVfTG9zZV9MaXN0Lmh0bWwM5aSx54mp5ZCv5LqLAGQCCg9kFgJmDxUGLS9OZXR3ZWJfTGlzdC9OZXR3ZWJfSG9tZV9QaWNrdXBfSW5mb01vcmUuaHRtbAzmi5vpooblkK%2Fkuos4aHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy9JbWFnZS90YWIxLzA5MC5naWYtL05ldHdlYl9MaXN0L05ldHdlYl9Ib21lX1BpY2t1cF9JbmZvTW9yZS5odG1sDOaLm%2BmihuWQr%2BS6iwBkAgsPZBYCZg8VBjAvZV9zYXRpL1N1cnZleUNvbXBsZXRlZEFkZFlpbi5hc3B4P2NvZGU9MTEyJmlkPTEJ5ruh5oSP5bqmOGh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vSW1hZ2UvdGFiMS8xMjkuZ2lmMC9lX3NhdGkvU3VydmV5Q29tcGxldGVkQWRkWWluLmFzcHg%2FY29kZT0xMTImaWQ9MQnmu6HmhI%2FluqYAZAIMD2QWAmYPFQYXL3N0dWR5L3N0dWR5X2luZGV4Lmh0bWwJ56CU6K6o6Ze0Omh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vSW1hZ2UvdGFiMS8yMTc3My5qcGcXL3N0dWR5L3N0dWR5X2luZGV4Lmh0bWwJ56CU6K6o6Ze0JjxhIGhyZWY9JyMnIHRhcmdldD0nX2JsYW5rJz4%2BPk1vcmU8L2E%2BZAIPD2QWAmYPFgIfAQIFFgoCAQ9kFgRmDxUDAzIxMEPlrabnlJ%2FljLrmlr3lt6XpgJrlkYrvvJrlrabnlJ%2FmnI3liqHkuK3lv4ND5qW85Zub5bGC5Y2r55Sf6Ze05pS56YCgMeWtpueUn%2BWMuuaWveW3pemAmuWRiu%2B8muWtpueUn%2BacjeWKoeS4reW%2Fg0PmpbwuLi5kAgEPDxYCHgRUZXh0BQUwMS0xM2RkAgIPZBYEZg8VAwMyMDlJ5a2m55Sf5Yy65pa95bel6YCa5ZGK77ya5riF5Y2O5aSn5a2m6LSi5Yqh57Sr6I2GQ%2BalvDMzMeOAgTMzM%2BijheS%2FruW3peeoizPlrabnlJ%2FljLrmlr3lt6XpgJrlkYrvvJrmuIXljY7lpKflrabotKLliqHntKvojYYuLi5kAgEPDxYCHwIFBTEyLTIzZGQCAw9kFgRmDxUDAzIwOELlrabnlJ%2FljLrmlr3lt6XpgJrlkYrvvJrmuIXljY7lpKflrabntKvojYblsYvpobblj4rlpJbnq4vpnaLnu7Tkv64z5a2m55Sf5Yy65pa95bel6YCa5ZGK77ya5riF5Y2O5aSn5a2m57Sr6I2G5bGL6aG2Li4uZAIBDw8WAh8CBQUxMi0xNmRkAgQPZBYEZg8VAwMyMDc75a2m55Sf5Yy65pa95bel6YCa5ZGK77ya57Sr6I2GMjEtMjPlj7fmpbznlLXmoq%2FmlLnpgKDlt6XnqIsp5a2m55Sf5Yy65pa95bel6YCa5ZGK77ya57Sr6I2GMjEtMjPlj7cuLi5kAgEPDxYCHwIFBTEyLTA5ZGQCBQ9kFgRmDxUDAzIwNlLlrabnlJ%2FljLrmlr3lt6XpgJrlkYrvvJrntKvojYblhazlr5MxNeOAgTE25Y%2B35qW855S35Y2r6Ze057u05L%2Bu5bel56iL77yI5LqM5pyf77yJLeWtpueUn%2BWMuuaWveW3pemAmuWRiu%2B8mue0q%2BiNhuWFrOWvkzE144CBMS4uLmQCAQ8PFgIfAgUFMTItMDZkZAIRD2QWCAIBDw8WBB4ISW1hZ2VVcmwFSmh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vdXBsb2Fkcy8yMDExOC8yMDExMDgwMzE2MDUxMzM4MzYuanBnHgdUb29sVGlwBSHmoIfpopjvvJrmlrDniYjlrrblm63kvb%2FnlKjmhJ%2Flj5dkZAIDDw8WBB8CBRjmlrDniYjlrrblm63kvb%2FnlKjmhJ%2Flj5cfBAUY5paw54mI5a625Zut5L2%2F55So5oSf5Y%2BXZGQCBQ8PFgQfAgVs5oiR5Lus55qE5a625Zut5paw54mI5bey57uP5LiK57q%2FLOWQjOWtpuS7rOWmguaenOacieS7gOS5iOaEj%2BingeaIluW7uuiuruWPr%2BS7peS4juaIkeS7rOiBlOezuyzmiJbogIXot5%2FluJYuHwQFbOaIkeS7rOeahOWutuWbreaWsOeJiOW3sue7j%2BS4iue6vyzlkIzlrabku6zlpoLmnpzmnInku4DkuYjmhI%2Fop4HmiJblu7rorq7lj6%2Fku6XkuI7miJHku6zogZTns7ss5oiW6ICF6Lef5biWLmRkAgcPDxYCHwIFGuWFseaciTcx5Lq65Y%2BC5LiO5LqG6K6o6K66ZGQCFQ9kFgQCAQ8WAh8BAgIWBGYPZBYEZg8VAQEyZAIBDw8WBB8DBUpodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL3VwbG9hZHMvMjAxMTQvMjAxMTA0MjQxMzU1MjQ5NzE4LmpwZx8EBSTmoIfpopjvvJrkvJjnp4Dlrr%2FoiI3kuYvntKvojYYzIzIwN0JkZAIBD2QWBGYPFQEBMWQCAQ8PFgQfAwVKaHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy91cGxvYWRzLzIwMTE0LzIwMTEwNDI0MTM1NjAyNjE0NS5qcGcfBAUk5qCH6aKY77ya5LyY56eA5a6%2F6IiN5LmL57Sr6I2GMSM2MDFCZGQCAw8WAh8BAgYWDGYPZBYEZg8VAwE2G%2BS8mOengOWuv%2BiIjeS5i%2Be0q%2BiNhjYjNjA5QRvkvJjnp4Dlrr%2FoiI3kuYvntKvojYY2IzYwOUFkAgEPDxYCHwIFBTA0LTI0ZGQCAQ9kFgRmDxUDATUb5LyY56eA5a6%2F6IiN5LmL57Sr6I2GNSM0MTlCG%2BS8mOengOWuv%2BiIjeS5i%2Be0q%2BiNhjUjNDE5QmQCAQ8PFgIfAgUFMDQtMjRkZAICD2QWBGYPFQMBNBvkvJjnp4Dlrr%2FoiI3kuYvntKvojYY1IzQxOUEb5LyY56eA5a6%2F6IiN5LmL57Sr6I2GNSM0MTlBZAIBDw8WAh8CBQUwNC0yNGRkAgMPZBYEZg8VAwEzG%2BS8mOengOWuv%2BiIjeS5i%2BWNl%2BWMujI3IzMwMxvkvJjnp4Dlrr%2FoiI3kuYvljZfljLoyNyMzMDNkAgEPDxYCHwIFBTA0LTI0ZGQCBA9kFgRmDxUDATIb5LyY56eA5a6%2F6IiN5LmL57Sr6I2GMyMyMDdCG%2BS8mOengOWuv%2BiIjeS5i%2Be0q%2BiNhjMjMjA3QmQCAQ8PFgIfAgUFMDQtMjRkZAIFD2QWBGYPFQMBMRvkvJjnp4Dlrr%2FoiI3kuYvntKvojYYxIzYwMUIb5LyY56eA5a6%2F6IiN5LmL57Sr6I2GMSM2MDFCZAIBDw8WAh8CBQUwNC0yM2RkAhcPZBYEAgEPFgIfAQICFgRmD2QWBGYPFQECMjlkAgEPDxYEHwMFSmh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vdXBsb2Fkcy8yMDExNC8yMDExMDQyNjE0NDIwOTgwMjEuanBnHwQFLeagh%2BmimO%2B8mueUn%2Ba0u%2BWcuuaZr%2BS5i%2Bmhu%2BefpeeahOWuieWFqOitpuekumRkAgEPZBYEZg8VAQIyNmQCAQ8PFgQfAwVKaHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy91cGxvYWRzLzIwMTE0LzIwMTEwNDI2MTQ0MTU3MjI1MS5qcGcfBAVC5qCH6aKY77ya55Sf5rS75Zy65pmv5LmL5Yiw5a2m55Sf5YWs5a%2BT4oCc5LiA56uZ5byP4oCd5oC75pyN5Yqh5Y%2BwZGQCAw8WAh8BAgYWDGYPZBYEZg8VAwIzMSfnlJ%2FmtLvlnLrmma%2FkuYvlpoLkvZXov5vlh7rlrabnlJ%2Flhazlr5Mn55Sf5rS75Zy65pmv5LmL5aaC5L2V6L%2Bb5Ye65a2m55Sf5YWs5a%2BTZAIBDw8WAh8CBQUwNC0yNmRkAgEPZBYEZg8VAwIzMDDnlJ%2FmtLvlnLrmma%2FkuYvnu7TmiqTlhazlr5PlhoXnmoTnp6nluo%2FkuI7ljavnlJ8q55Sf5rS75Zy65pmv5LmL57u05oqk5YWs5a%2BT5YaF55qE56ep5bqPLi4uZAIBDw8WAh8CBQUwNC0yNmRkAgIPZBYEZg8VAwIyOSTnlJ%2FmtLvlnLrmma%2FkuYvpobvnn6XnmoTlronlhajorabnpLok55Sf5rS75Zy65pmv5LmL6aG755%2Bl55qE5a6J5YWo6K2m56S6ZAIBDw8WAh8CBQUwNC0yNmRkAgMPZBYEZg8VAwIyOC3nlJ%2FmtLvlnLrmma%2FkuYvkuIrigJzmiJHku6znmoTlrrblm63igJ3nvZHnq5kq55Sf5rS75Zy65pmv5LmL5LiK4oCc5oiR5Lus55qE5a625Zut4oCdLi4uZAIBDw8WAh8CBQUwNC0yNmRkAgQPZBYEZg8VAwIyNxjnlJ%2FmtLvlnLrmma%2FkuYvmib7mpbzplb8Y55Sf5rS75Zy65pmv5LmL5om%2B5qW86ZW%2FZAIBDw8WAh8CBQUwNC0yNmRkAgUPZBYEZg8VAwIyNjnnlJ%2FmtLvlnLrmma%2FkuYvliLDlrabnlJ%2Flhazlr5PigJzkuIDnq5nlvI%2FigJ3mgLvmnI3liqHlj7Aq55Sf5rS75Zy65pmv5LmL5Yiw5a2m55Sf5YWs5a%2BT4oCc5LiA56uZLi4uZAIBDw8WAh8CBQUwNC0yNmRkAhkPZBYCAgEPFgIfAQIGFgxmD2QWBGYPFQMDNjMzDOaEn%2BiwoualvOmVvxRb546L5rSLXeaEn%2BiwoualvOmVv2QCAQ8PFgIfAgUFMTEtMjBkZAIBD2QWBGYPFQMDNjMyEuaEn%2BiwouS%2Fnea0gemYv%2BWnqBpb546L5rSLXeaEn%2BiwouS%2Fnea0gemYv%2BWnqGQCAQ8PFgIfAgUFMTEtMjBkZAICD2QWBGYPFQMDNjMxGuaEn%2BiwojI15Y%2B35qW85qW86ZW%2F5byg6Zu3JVvpg63kuIDpmoZd5oSf6LCiMjXlj7fmpbzmpbzplb%2FlvKDpm7dkAgEPDxYCHwIFBTEwLTI0ZGQCAw9kFgRmDxUDAzYzMCHmhJ%2FosKLmoYPmnY7nmoTotJ%2FotKPkurrliJjluIjlgoUsW%2BeOi%2Bato%2BekvF3mhJ%2FosKLmoYPmnY7nmoTotJ%2FotKPkurrliJjluIguLi5kAgEPDxYCHwIFBTEwLTE3ZGQCBA9kFgRmDxUDAzYyORjmhJ%2FosKLng63msLTnj63nmoTluIjlgoUgW%2Babuei2il3mhJ%2FosKLng63msLTnj63nmoTluIjlgoVkAgEPDxYCHwIFBTEwLTA3ZGQCBQ9kFgRmDxUDAzYyOCLmhJ%2FosKJj5qW85bel5L2c5Lq65ZGY546L5ZCR6aOe77yBKlvkv47nkKzmu6Jd5oSf6LCiY%2BalvOW3peS9nOS6uuWRmOeOi%2BWQkS4uLmQCAQ8PFgIfAgUFMDktMjhkZAIbD2QWBAIBDxYCHwECAhYEZg9kFgRmDxUBAjI1ZAIBDw8WBB8DBUpodHRwOi8vbXlob21lLnRzaW5naHVhLmVkdS5jbi9tYW5hZ2UvL3VwbG9hZHMvMjAxMTQvMjAxMTA0MjYxNDE3NDcxMTIyLmpwZx8EBSHmoIfpopjvvJrmoKHluobmjqXlvoXlv5fmhL%2FmtLvliqhkZAIBD2QWBGYPFQECMjRkAgEPDxYEHwMFSmh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vdXBsb2Fkcy8yMDExNC8yMDExMDQyNjE0MTgzMjQ3OTIuanBnHwQFMOagh%2BmimO%2B8muKAnOagoeW6huaXpeWNq%2BeUn%2Batu%2Binkua4heaJq%2Ba0u%2BWKqOKAnWRkAgMPFgIfAQIGFgxmD2QWBGYPFQMCNDAV5LuK5aSp5oiR5piv6YKu6YCS5ZGYFeS7iuWkqeaIkeaYr%2BmCrumAkuWRmGQCAQ8PFgIfAgUFMDgtMTBkZAIBD2QWBGYPFQMCMzkM5b6q546v5Yip55SoDOW%2BqueOr%2BWIqeeUqGQCAQ8PFgIfAgUFMDgtMTBkZAICD2QWBGYPFQMCMjUY5qCh5bqG5o6l5b6F5b%2BX5oS%2F5rS75YqoGOagoeW6huaOpeW%2BheW%2Fl%2BaEv%2Ba0u%2BWKqGQCAQ8PFgIfAgUFMDQtMjZkZAIDD2QWBGYPFQMCMjQn4oCc5qCh5bqG5pel5Y2r55Sf5q276KeS5riF5omr5rS75Yqo4oCdJ%2BKAnOagoeW6huaXpeWNq%2BeUn%2Batu%2Binkua4heaJq%2Ba0u%2BWKqC4uLmQCAQ8PFgIfAgUFMDQtMjZkZAIED2QWBGYPFQMCMjMV4oCc5pen5pWZ5p2Q5b6q546v4oCdFeKAnOaXp%2BaVmeadkOW%2BqueOr%2BKAnWQCAQ8PFgIfAgUFMDQtMjZkZAIFD2QWBGYPFQMCMjIw4oCc5L6%2F5Yip5ZCM5a2m55Sf5rS777yM5LuK5aSp5oiR5piv6YKu6YCS5ZGY4oCdJ%2BKAnOS%2Bv%2BWIqeWQjOWtpueUn%2Ba0u%2B%2B8jOS7iuWkqeaIkeaYry4uLmQCAQ8PFgIfAgUFMDQtMjZkZAIdD2QWAgIBDxYCHwECBxYOZg9kFgRmDxUDBDM5MTZN77yI6L2s77yJ5L%2Bd5Y2r6YOo5o%2BQ56S677yaNeaciDHml6Xotbfml6DniYzmiJbml6DkuLTmoIfnlLXliqjovabnpoHmraLlhaXmoKEp77yI6L2s77yJ5L%2Bd5Y2r6YOo5o%2BQ56S677yaNeaciDHml6XotbcuLi5kAgEPDxYCHwIFBTAzLTEyZGQCAQ9kFgRmDxUDBDM4NzMh56S%2B5Lya54Gr5oOF6YCa5oql5Y%2BK5a6J5YWo5o%2BQ56S6IeekvuS8mueBq%2BaDhemAmuaKpeWPiuWuieWFqOaPkOekumQCAQ8PFgIfAgUFMTEtMTRkZAICD2QWBGYPFQMEMzg2NCHlvq7lsI%2Fngavmg4XpgJrmiqXlj4rlronlhajmj5DnpLoh5b6u5bCP54Gr5oOF6YCa5oql5Y%2BK5a6J5YWo5o%2BQ56S6ZAIBDw8WAh8CBQUxMC0xMGRkAgMPZBYEZg8VAwQzODYyO%2B%2B8iOi9rOWPke%2B8ieitpuaDhemAmuaKpeS4juWuieWFqOaPkOekuu%2B8iDIwMTjlubTnrKwz5pyf77yJLe%2B8iOi9rOWPke%2B8ieitpuaDhemAmuaKpeS4juWuieWFqOaPkOekuu%2B8iC4uLmQCAQ8PFgIfAgUFMTAtMDlkZAIED2QWBGYPFQMEMzc5MjzovazlhbPkuo7igJzkupTkuIDigJ3lgYfmnJ%2FlrabnlJ%2Flronlhajms6jmhI%2FkuovpobnnmoTpgJrnn6Ut6L2s5YWz5LqO4oCc5LqU5LiA4oCd5YGH5pyf5a2m55Sf5a6J5YWo5rOoLi4uZAIBDw8WAh8CBQUwNC0yOGRkAgUPZBYEZg8VAwQzNzg2Qe%2B8iOi9rOWPke%2B8iei%2Fkeacn%2BitpuaDhemAmuaKpeS4juWuieWFqOaPkOekuu%2B8iDIwMTjlubTnrKwy5pyf77yJLe%2B8iOi9rOWPke%2B8iei%2Fkeacn%2BitpuaDhemAmuaKpeS4juWuieWFqOaPkC4uLmQCAQ8PFgIfAgUFMDQtMjBkZAIGD2QWBGYPFQMEMzc2N0LvvIjovazlj5HvvInlhbPkuo7muIXmmI7oioLlgYfmnJ%2FlrabnlJ%2Flronlhajms6jmhI%2FkuovpobnnmoTpgJrnn6Ut77yI6L2s5Y%2BR77yJ5YWz5LqO5riF5piO6IqC5YGH5pyf5a2m55Sf5a6JLi4uZAIBDw8WAh8CBQUwNC0wNGRkAh8PZBYCZg8WAh8BAgEWAgIBD2QWCGYPFQEt5oKo5a%2B55paw54mI4oCc5oiR5Lus55qE5a625Zut4oCd5ruh5oSP5ZCX77yfZAIDDxAPFgYeC18hRGF0YUJvdW5kZx4NRGF0YVRleHRGaWVsZAUGQW5zd2VyHg5EYXRhVmFsdWVGaWVsZAUCSURkEBUFDOmdnuW4uOa7oeaEjwbmu6HmhI8G5LiA6IisCeS4jea7oeaEjw%2FpnZ7luLjkuI3mu6HmhI8VBQMyMjEDMjIyAzIyMwMyMjQDMjI1FCsDBWdnZ2dnZGQCBQ8PFgIeD0NvbW1hbmRBcmd1bWVudAUBMGRkAgYPFQECNTJkAiEPZBYEAgEPFgIfAQICFgRmD2QWBGYPFQECOTlkAgEPDxYEHwMFSmh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vdXBsb2Fkcy8yMDE1NC8yMDE1MDQyMTIzMDgxODQ2MDUuanBnHwQFOuagh%2BmimO%2B8mumdnuW4uOWWnOasouaIkeS7rDMx5Y%2B35qW85bm06L276LKM576O55qE5qW86ZW%2Ffn5kZAIBD2QWBGYPFQECMzRkAgEPDxYEHwMFSmh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vdXBsb2Fkcy8yMDExOC8yMDExMDgwMzE2MTQxMDM2NDkuanBnHwQFOuagh%2BmimO%2B8mue0q%2BiNhjEx5Y%2B35qW85ZKM5oiRLS3mnY7mpaDmpaDmpbzplb%2FpgqPkupvlsI%2FkuotkZAIDDxYCHwECBhYMZg9kFgRmDxUDAzE3NiHmoYPmnY7kuIDlsYLnmoTnur%2FpnaLlpb3lkIPliLDniIYh5qGD5p2O5LiA5bGC55qE57q%2F6Z2i5aW95ZCD5Yiw54iGZAIBDw8WAh8CBQUwNi0yOGRkAgEPZBYEZg8VAwMxNzAw5oSf6LCi5a2m5aCC6Lev5L%2Bd5a6J5biI5YKF5ZKM5aW95b%2BD55qE5ZCM5a2m77yBJ%2BaEn%2BiwouWtpuWggui3r%2BS%2FneWuieW4iOWCheWSjOWlveW%2Fgy4uLmQCAQ8PFgIfAgUFMDUtMTRkZAICD2QWBGYPFQMDMTI5Q%2Be0q%2BiNhuWbreWFreWPt%2Beql%2BWPo%2BeahOeCuOm4oemlremdnuW4uOWlveWQg%2B%2B8jOW4iOWChemdnuW4uOeDreaDhSEn57Sr6I2G5Zut5YWt5Y%2B356qX5Y%2Bj55qE54K46bih6aWt6Z2eLi4uZAIBDw8WAh8CBQUwOS0wOGRkAgMPZBYEZg8VAwMxMjdO6aqR6KGM5rOo5oSP5a6J5YWo77yM5LuK5aSp6YCg5oiQ5LqG5LiA5Liq5bCP5LqL5pWF77yM5biM5pyb5aSn5a625byV5Lul5Li65oiSJ%2BmqkeihjOazqOaEj%2BWuieWFqO%2B8jOS7iuWkqemAoOaIkOS6hi4uLmQCAQ8PFgIfAgUFMDgtMjVkZAIED2QWBGYPFQMDMTI2G%2Ba4heWNjuWutuWbree9keW%2BruS%2FoeW5s%2BWPsBvmuIXljY7lrrblm63nvZHlvq7kv6HlubPlj7BkAgEPDxYCHwIFBTA3LTI1ZGQCBQ9kFgRmDxUDAzEyNT%2FmhJ%2FosKLlkKzmtpvlm63po5%2FloILnmoTmnajkuLvku7vlj4rlt6XkvZzkurrlkZjmi77ph5HkuI3mmKfvvIEn5oSf6LCi5ZCs5rab5Zut6aOf5aCC55qE5p2o5Li75Lu75Y%2BKLi4uZAIBDw8WAh8CBQUwNi0xOGRkAiMPZBYEAgEPFgIfAQICFgRmD2QWBGYPFQECMTVkAgEPDxYEHwMFSmh0dHA6Ly9teWhvbWUudHNpbmdodWEuZWR1LmNuL21hbmFnZS8vdXBsb2Fkcy8yMDExOC8yMDExMDgwMzE2MTE0ODkxMzUuanBnHwQFIeagh%2BmimO%2B8mue6vue8k%2BecvOeWsuWKs%2BWwj%2BeqjemXqGRkAgEPZBYEZg8VAQIxNGQCAQ8PFgQfAwVKaHR0cDovL215aG9tZS50c2luZ2h1YS5lZHUuY24vbWFuYWdlLy91cGxvYWRzLzIwMTE4LzIwMTEwODAzMTYwNzQ2MzY3OS5qcGcfBAUk5qCH6aKY77ya5rSX6KGj5py65ouS57ud6LaF6YeP5rSX5rakZGQCAw8WAh8BAgUWCmYPZBYEZg8VAwIxNRjnur7nvJPnnLznlrLlirPlsI%2Fnqo3pl6gY57q%2B57yT55y855ay5Yqz5bCP56qN6ZeoZAIBDw8WAh8CBQUwNC0yNGRkAgEPZBYEZg8VAwIxNBvmtJfooaPmnLrmi5Lnu53otoXph4%2FmtJfmtqQb5rSX6KGj5py65ouS57ud6LaF6YeP5rSX5rakZAIBDw8WAh8CBQUwNC0yNGRkAgIPZBYEZg8VAwIxMyHlu7rnq4voia%2Flpb3kurrpmYXlhbPns7vnmoTljp%2FliJkh5bu656uL6Imv5aW95Lq66ZmF5YWz57O755qE5Y6f5YiZZAIBDw8WAh8CBQUwNC0yNGRkAgMPZBYEZg8VAwIxMhvljYHnp43mnIDkvbPppa7po5%2FmkK3phY3ms5Ub5Y2B56eN5pyA5L2z6aWu6aOf5pCt6YWN5rOVZAIBDw8WAh8CBQUwNC0yNGRkAgQPZBYEZg8VAwIxMRXlgaXlurfppa7po5%2Fph5HlrZfloZQV5YGl5bq36aWu6aOf6YeR5a2X5aGUZAIBDw8WAh8CBQUwNC0yNGRkAiUPZBYCAgEPFgIfAQIGFgxmD2QWBGYPFQMEMzIyOBLok53oibLkuprpurvluIPljIUS6JOd6Imy5Lqa6bq75biD5YyFZAIBDw8WAh8CBQUxMi0zMGRkAgEPZBYEZg8VAwQzMjI0EueZveiJsumAmuivneiAs%2BacuhLnmb3oibLpgJror53ogLPmnLpkAgEPDxYCHwIFBTEyLTAyZGQCAg9kFgRmDxUDBDMyMjUL5a2m55SfSUPljaEL5a2m55SfSUPljaFkAgEPDxYCHwIFBTEyLTAyZGQCAw9kFgRmDxUDBDMyMjYL5a2m55SfSUPljaEL5a2m55SfSUPljaFkAgEPDxYCHwIFBTEyLTAyZGQCBA9kFgRmDxUDBDMyMjcM5YW25LuW5Y2h57G7DOWFtuS7luWNoeexu2QCAQ8PFgIfAgUFMTItMDJkZAIFD2QWBGYPFQMEMzIyMwbmsLTmna8G5rC05p2vZAIBDw8WAh8CBQUxMS0yNWRkAicPZBYCAgEPFgIfAQIGFgxmD2QWBGYPFQMEOTI1MhvlkJXlsJHolb7lkIzlrabnmoTlu7rooYzljaEb5ZCV5bCR6JW%2B5ZCM5a2m55qE5bu66KGM5Y2hZAIBDw8WAh8CBQUwMS0wOGRkAgEPZBYEZg8VAwQ5MjUxC0FpcnBvZHMgUHJvC0FpcnBvZHMgUHJvZAIBDw8WAh8CBQUwMS0wNmRkAgIPZBYEZg8VAwQ5MjQ5K2Jvc2UgcWMzNeS6jOS7oyDngbDoibLlpLTmiLTlvI%2Fok53niZnogLPmnLoZYm9zZSBxYzM15LqM5LujIOeBsOiJsi4uLmQCAQ8PFgIfAgUFMDEtMDJkZAIDD2QWBGYPFQMEOTI1MxFhcHBsZXBlbmNpbOS6jOS7oxFhcHBsZXBlbmNpbOS6jOS7o2QCAQ8PFgIfAgUFMTItMzBkZAIED2QWBGYPFQMEOTI0MhXouqvku73or4HlkozkuqTpgJrljaEV6Lqr5Lu96K%2BB5ZKM5Lqk6YCa5Y2hZAIBDw8WAh8CBQUxMi0yN2RkAgUPZBYEZg8VAwQ5MjQxD%2BmTtuihjOWNoeWNoeWMhQ%2Fpk7booYzljaHljaHljIVkAgEPDxYCHwIFBTEyLTI2ZGQYAQUeX19Db250cm9sc1JlcXVpcmVQb3N0QmFja0tleV9fFgMFIG5ldF9EZWZhdWx0X0xvZ2luQ3RybDEkbGJ0bkxvZ2luBSJuZXRfRGVmYXVsdF9Mb2dpbkN0cmwxJGxidG5TZWFyY2gxBS1Ib21lX1ZvdGVfSW5mb0N0cmwxJFJlcGVhdGVyMSRjdGwwMSRidG5TZWxlY3T3YeJTrzEZctmtn9HQ7SDwpbNshg%3D%3D&__VIEWSTATEGENERATOR=CA0B0334&net_Default_LoginCtrl1%24txtUserName=${loggedInUser.userId}&net_Default_LoginCtrl1%24txtUserPwd=${loggedInUser.password}&net_Default_LoginCtrl1%24lbtnLogin.x=17&net_Default_LoginCtrl1%24lbtnLogin.y=10&net_Default_LoginCtrl1%24txtSearch1=&Home_Img_NewsCtrl1%24hfJsImg=imgUrl1%3D%27http%3A%2F%2Fmyhome.tsinghua.edu.cn%2Fmanage%2F%2Fuploads%2F20192%2F201902221547073963.jpg%27%3Bimgtext1%3D%27%B9%D8%D3%DA%D1%A7%C9%FA%C7%F8%D7%D4%D0%D0%B3%B5%D0%DE%B3%B5%B7%FE%CE%F1%B5%C4%CE%C2%DC%B0%CC%E1%CA%BE%27%3BimgLink1%3D%27%2FNetweb_List%2FNews_notice_Detail.aspx%3Fcode%3D3909%27%3BimgUrl2%3D%27http%3A%2F%2Fmyhome.tsinghua.edu.cn%2Fmanage%2F%2Fuploads%2F20192%2F201902210840568051.jpg%27%3Bimgtext2%3D%27%B9%D8%D3%DA%B7%A2%B7%C5%B5%E7%B6%AF%B3%B5%C1%D9%CA%B1%B1%EA%CA%B6%BA%CD%B5%E7%D7%D3%B1%EA%C7%A9%B5%C4%CE%C2%DC%B0%CC%E1%CA%BE%27%3BimgLink2%3D%27%2FNetweb_List%2FNews_notice_Detail.aspx%3Fcode%3D3906%27%3BimgUrl3%3D%27http%3A%2F%2Fmyhome.tsinghua.edu.cn%2Fmanage%2F%2Fuploads%2F201512%2F201512251532288028.jpg%27%3Bimgtext3%3D%27%B9%D8%D3%DA%A1%B0%CE%D2%C3%C7%B5%C4%BC%D2%D4%B0%A1%B1%CD%F8%BF%AA%CD%A8%CE%A2%D0%C5%B9%AB%D6%DA%C6%BD%CC%A8%B5%C4%CD%A8%D6%AA%27%3BimgLink3%3D%27%2FNetweb_List%2FNews_notice_Detail.aspx%3Fcode%3D3316%27%3Bvar+pics+%3D+imgUrl1%2B%27%7C%27%2BimgUrl2%2B%27%7C%27%2BimgUrl3%3Bvar+links+%3D+imgLink1%2B%27%7C%27%2BimgLink2%2B%27%7C%27%2BimgLink3%3Bvar+texts+%3D+imgtext1%2B%27%7C%27%2Bimgtext2%2B%27%7C%27%2Bimgtext3&Home_Img_ActivityCtrl1%24hfScript=imgUrl1%3D%27http%3A%2F%2Fmyhome.tsinghua.edu.cn%2Fmanage%2F%2Fuploads%2F20114%2F201104261457207049.jpg%27%3Bimgtext1%3D%27%D1%A7%C9%FA%C9%E7%C7%F8%A1%B0%D7%CF%BE%A3%CE%C4%BB%AF%D4%C2%A1%B1%BB%EE%B6%AF%27%3BimgLink1%3D%27%2Fnetweb_shenghuo%2FNetweb_Activity_Detail.aspx%3Fcode%3D3%27%3BimgUrl2%3D%27http%3A%2F%2Fmyhome.tsinghua.edu.cn%2Fmanage%2F%2Fuploads%2F20114%2F201104261457305323.jpg%27%3Bimgtext2%3D%27%D0%C2%C9%FA%B0%B2%C8%AB%BD%CC%D3%FD%BB%EE%B6%AF%27%3BimgLink2%3D%27%2Fnetweb_shenghuo%2FNetweb_Activity_Detail.aspx%3Fcode%3D2%27%3Bvar+pics+%3D+imgUrl1%2B%27%7C%27%2BimgUrl2%3Bvar+links+%3D+imgLink1%2B%27%7C%27%2BimgLink2%3Bvar+texts+%3D+imgtext1%2B%27%7C%27%2Bimgtext2&Home_Vote_InfoCtrl1%24Repeater1%24ctl01%24hfID=52&Home_Vote_InfoCtrl1%24Repeater1%24ctl01%24rdolstSelect=221"
            ).inputStream.close()
            if (Thread.interrupted()) {
                Log.i("interrupt", "ele pay [0]")
                return null
            }

            // Get necessary form data
            lateinit var username: String
            lateinit var louhao: String
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fdee49932a3526446d0187ab9040227bca90a6e14cc9/netweb_user/recharge_ele.aspx",
                referer = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fdee49932a3526446d0187ab9040227bca90a6e14cc9/netweb_user/",
                cookie = loggedInUser.vpnTicket
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this, "gb2312"))
                var readLine: String?
                while ((reader.readLine().also { readLine = it }) != null) {
                    if (readLine!!.contains("name=\"username\"")) {
                        username = readLine!!.run { substring(indexOf("value=") + 7, indexOf("' />")) }
                    } else if (readLine!!.contains("name=\"louhao\"")) {
                        louhao = readLine!!.run { substring(indexOf("value=") + 7, indexOf("' />")) }
                    }
                }
                reader.close()
                close()
            }
            Log.i("recharge username", username)
            Log.i("recharge louhao", louhao)
            if (Thread.interrupted()) {
                Log.i("interrupt", "ele pay [1]")
                return null
            }

            // Send pay request to tsinghua
            lateinit var redirect: String
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fdee49932a3526446d0187ab9040227bca90a6e14cc9/netweb_user/recharge_pay_ele.aspx",
                referer = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fdee49932a3526446d0187ab9040227bca90a6e14cc9/netweb_user/recharge_ele.aspx",
                cookie = loggedInUser.vpnTicket,
                post = "__EVENTTARGET=&__EVENTARGUMENT=&__VIEWSTATE=%2fwEPDwUJNzkyOTg4MDg4ZGTEGqvW9%2bJoVX5cqytAfdRw7k3JtQ%3d%3d&__VIEWSTATEGENERATOR=D6B25EB7&recharge_eleCtrl1\$RadioButtonList1=%d6%a7%b8%b6%b1%a6%d6%a7%b8%b6&write_money=$money&username=${username}&louhao=${louhao}&banktype=alipay"
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this))
                var readLine: String?
                while ((reader.readLine().also { readLine = it }) != null) {
                    if (readLine!!.contains("action=")) {
                        redirect = readLine!!.run { substring(indexOf("action=") + 8, indexOf("\" method=")) }
                            .replace("amp;", "")
                        break
                    }
                }
                reader.close()
                close()
            }
            Log.i("recharge", "redirect")
            if (Thread.interrupted()) {
                Log.i("interrupt", "ele pay [2]")
                return null
            }

            // Get pay id
            val id: String
            val xxx: String
            connect<HttpsURLConnection>(
                redirect,
                referer = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fdee49932a3526446d0187ab9040227bca90a6e14cc9/netweb_user/recharge_pay_ele.aspx",
                cookie = loggedInUser.vpnTicket
            ).inputStream.run {
                Jsoup.parse(this, "GBK", redirect).getElementById("form2").run {
                    id = child(0).attr("value")
                    xxx = child(1).attr("value").replace("=", "%3d")
                }
                close()
            }
            Log.i("recharge id", id)
            if (Thread.interrupted()) {
                Log.i("interrupt", "ele pay [3]")
                return null
            }

            // Send pay request to alipay
            lateinit var url: String
            lateinit var form: String
            connect<HttpsURLConnection>(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff489a327e7c4377068ea48d546d301d731c068b/sfpt/sendToAlipayAction.action",
                referer = redirect,
                cookie = "${loggedInUser.vpnTicket}; ID$id=3",
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
                        break
                    }
                }
                reader.close()
                close()
            }
            Log.i("recharge", "redirect")
            if (Thread.interrupted()) {
                Log.i("interrupt", "ele pay [4]")
                return null
            }

            // Get pay code
            connect<HttpsURLConnection>(
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
                Log.i("interrupt", "ele pay [5]")
                return null
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    fun logout() {
        connect<HttpsURLConnection>(
            "https://webvpn.tsinghua.edu.cn/logout",
            null,
            loggedInUser.vpnTicket
        ).inputStream.close()
    }

    class UserLoginError : Exception()

    private fun HttpsURLConnection.inputCheck(charsetName: String = "UTF-8") {
        this.inputStream.run {
            val reader = BufferedReader(InputStreamReader(this, charsetName))
            var readLine: String?
            while (reader.readLine().also { readLine = it } != null) {
                println(readLine)
            }
        }
    }
}