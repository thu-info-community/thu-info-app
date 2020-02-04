package com.unidy2002.thuinfo.data.util

import android.content.Context
import android.util.Log
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
        loggedInUser.vpnTicket = connect<HttpsURLConnection>("https://webvpn.tsinghua.edu.cn/login")
            .getHeaderField("Set-Cookie")
            .run { substring(0, this.indexOf(';')) }
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

    fun getNews(mode: MODE, param: Int = 0) {
        when (mode) {
            MODE.NONE ->
                loggedInUser.newsContainer.getNews(10, false)
            MODE.REFRESH ->
                loggedInUser.newsContainer.getNews(10, true)
            MODE.MORE ->
                loggedInUser.newsContainer.getNews(10, false)
            MODE.FILTER -> {
                loggedInUser.newsContainer.changeState(param)
                loggedInUser.newsContainer.getNews(10, true)
            }
        }
    }

    fun getPrettyPrintHTML(url: String): NewsHTML? =
        try {
            Jsoup.connect(url).cookie(
                "wengine_vpn_ticket",
                loggedInUser.vpnTicket.run { substring(this.indexOf('=') + 1) }
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

    fun logout() {
        connect<HttpsURLConnection>(
            "https://webvpn.tsinghua.edu.cn/logout",
            null,
            loggedInUser.vpnTicket
        ).inputStream.close()
    }

    enum class MODE { NONE, REFRESH, MORE, FILTER }

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