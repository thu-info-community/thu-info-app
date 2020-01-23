package com.unidy2002.thuinfo.data.lib

import android.content.Context
import android.util.Log
import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONObject
import com.unidy2002.thuinfo.data.model.PersonalCalendar
import com.unidy2002.thuinfo.data.model.ECardRecord
import com.unidy2002.thuinfo.data.model.JoggingRecord
import com.unidy2002.thuinfo.data.model.LoggedInUser
import com.unidy2002.thuinfo.data.model.report.ReportItem
import com.unidy2002.thuinfo.ui.login.LoginActivity
import jxl.Workbook
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.URL
import java.nio.charset.StandardCharsets
import javax.net.ssl.HttpsURLConnection

class Network {
    private val loggedInUser: LoggedInUser
        get() = LoginActivity.loginViewModel.getLoggedInUser()

    private fun connect(
        url: String,
        referer: String? = null,
        cookie: String? = null,
        post: String? = null
    ) = (URL(url).openConnection() as HttpsURLConnection).apply {
        setRequestProperty(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36"
        )
        referer?.run { setRequestProperty("referer", this) }
        cookie?.run { setRequestProperty("cookie", this) }
        post?.run {
            doOutput = true
            requestMethod = "POST"
            val out = OutputStreamWriter(outputStream, StandardCharsets.UTF_8)
            out.write(this)
            out.flush()
            out.close()
        }
    }

    fun login(loggedInUser: LoggedInUser, password: String) {
        // Get vpn ticket
        loggedInUser.vpnTicket = connect("https://webvpn.tsinghua.edu.cn/login")
            .getHeaderField("Set-Cookie")
            .run { substring(0, this.indexOf(';')) }
            .also { Log.i("VPN TICKET", it) }

        // Login to webvpn
        connect(
            "https://webvpn.tsinghua.edu.cn/do-login?local_login=true",
            "https://webvpn.tsinghua.edu.cn/login",
            loggedInUser.vpnTicket,
            "auth_type=local&username=${loggedInUser.userId}&sms_code=&password=$password"
        ).inputStream.run {
            val reader = BufferedReader(InputStreamReader(this))
            var readLine: String?
            while (reader.readLine().also { readLine = it } != null) {
                if (readLine!!.matches(Regex(".*var logoutOtherToken = '.+'.*"))) {
                    readLine = readLine!!.substring(readLine!!.indexOf('\'') + 1)
                    readLine = readLine!!.substring(0, readLine!!.indexOf('\''))
                    connect(
                        "https://webvpn.tsinghua.edu.cn/do-confirm-login",
                        "https://webvpn.tsinghua.edu.cn/do-login?local_login=true",
                        loggedInUser.vpnTicket,
                        "username=${loggedInUser.userId}&logoutOtherToken=$readLine"
                    ).inputStream.close()
                    Log.i("KICK", readLine!!)
                }
            }
            reader.close()
            close()
        }

        //loggedInUser.vpnTicket = "wengine_vpn_ticket=b4550fe4944976d1"

        // Login to tsinghua info
        connect(
            "https://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/Login",
            "https://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/",
            loggedInUser.vpnTicket,
            "redirect=NO&userName=${loggedInUser.userId}&password=$password&x=0&y=0"
        ).inputStream.close()

        // Invalidate zhjw session
        connect(
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/servlet/InvalidateSession",
            "https://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/",
            loggedInUser.vpnTicket
        ).inputStream.close()

        // Get username
        connect(
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/minichan/roamaction.jsp?id=2612",
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/minichan/bks_grzm.jsp",
            loggedInUser.vpnTicket
        ).inputStream.run {
            loggedInUser.displayName = ""
            try {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                var readLine: String?
                try {
                    while (reader.readLine().also { readLine = it } != null) {
                        if (readLine!!.contains("<td class=\"report1_3\">")) {
                            loggedInUser.displayName = readLine!!.substring(
                                readLine!!.indexOf('>') + 1, readLine!!.indexOf("</")
                            )
                            Log.i("USERNAME", loggedInUser.displayName)
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

        // Get the tickets
        connect(
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/prelogin.jsp?result=1",
            loggedInUser.vpnTicket
        ).inputStream.run {
            try {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                var readLine: String?
                try {
                    while (reader.readLine().also { readLine = it } != null) {
                        if (readLine!!.contains("a name=\"9-824\"")) {
                            loggedInUser.eCardTicket =
                                readLine!!
                                    .substring(
                                        readLine!!.indexOf("src") + 5, readLine!!.indexOf("\" id=\"9-824")
                                    )
                                    .replace("amp;", "")
                            Log.i("ECARD TICKET", loggedInUser.eCardTicket)
                        } else if (readLine!!.contains("a name=\"9-792\"")) {
                            // Link user with zhjw
                            with(
                                readLine!!
                                    .substring(
                                        readLine!!.indexOf("src") + 5, readLine!!.indexOf("\" id=\"9-792")
                                    ).replace("amp;", "")
                            ) {
                                connect(
                                    this,
                                    "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                                    loggedInUser.vpnTicket
                                ).inputStream.close()
                                Log.i("ZHJW TICKET", this)
                            }
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

    fun getEcard(force: Boolean): Boolean {
        if (force || !loggedInUser.eCardInitialized()) {
            try {
                if (!loggedInUser.eCardInitialized()) {
                    // Connect
                    connect(
                        loggedInUser.eCardTicket,
                        "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                        loggedInUser.vpnTicket
                    ).inputStream.close()
                }

                // Parse EXCEL file
                connect(
                    "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a/user/ExDetailsDown.do",
                    loggedInUser.eCardTicket,
                    loggedInUser.vpnTicket
                ).inputStream.run {
                    val workbook = Workbook.getWorkbook(this)
                    val sheet = workbook.getSheet(0)
                    val rowCount = sheet.rows
                    val table = ECardRecord()
                    for (i in rowCount - 2 downTo 1) {
                        val cells = sheet.getRow(i)
                        table.addElement(
                            cells[1].contents,
                            cells[2].contents,
                            cells[4].contents,
                            cells[5].contents.toDouble()
                        )
                    }
                    close()
                    loggedInUser.eCardRecord = table
                }
            } catch (e: Exception) {
                e.printStackTrace()
                return false
            }
        }
        return true
    }

    fun getCalender(context: Context) {
        if (!loggedInUser.calenderInitialized()) {
            val scheduleDBManager = ScheduleDBManager.getInstance(context)
            with(scheduleDBManager.lessonList) {
                if (isEmpty()) {
                    try {
                        connect(
                            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/jxmh_out.do?m=bks_jxrl_all&p_start_date=20190901&p_end_date=20200131&jsoncallback=m",
                            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                            loggedInUser.vpnTicket
                        ).inputStream.run {
                            val reader = BufferedReader(InputStreamReader(this))
                            val stringBuilder = StringBuilder()
                            var readLine: String?
                            while (reader.readLine().also { readLine = it } != null)
                                stringBuilder.append(readLine)
                            val result =
                                stringBuilder.substring(stringBuilder.indexOf("(") + 1, stringBuilder.lastIndexOf(")"))
                            reader.close()
                            close()
                            loggedInUser.personalCalendar = PersonalCalendar(result)
                        }

                        for (lesson in loggedInUser.personalCalendar.lessonList)
                            scheduleDBManager.addLesson(lesson)
                        for (exam in loggedInUser.personalCalendar.examList)
                            scheduleDBManager.addExam(exam)
                        for (auto in loggedInUser.personalCalendar.autoShortenMap)
                            scheduleDBManager.addAuto(auto.key, auto.value.first, auto.value.second)
                        for (custom in loggedInUser.personalCalendar.customShortenMap)
                            scheduleDBManager.addCustom(custom.key, custom.value)
                        for (custom in loggedInUser.personalCalendar.colorMap)
                            scheduleDBManager.addColor(custom.key, custom.value)
                    } catch (e: Exception) {
                        loggedInUser.personalCalendar =
                            PersonalCalendar(
                                mutableListOf(),
                                mutableListOf(),
                                mutableMapOf(),
                                mutableMapOf(),
                                mutableMapOf()
                            )
                        e.printStackTrace()
                    }
                } else {
                    loggedInUser.personalCalendar =
                        PersonalCalendar(
                            this,
                            scheduleDBManager.examList,
                            scheduleDBManager.autoShortenMap,
                            scheduleDBManager.customShortenMap,
                            scheduleDBManager.colorMap
                        )
                }
            }
        }
    }

    fun getNews(mode: MODE) {
        when (mode) {
            MODE.NONE ->
                loggedInUser.newsContainer.getNews(10, false)
            MODE.REFRESH ->
                loggedInUser.newsContainer.getNews(10, true)
            MODE.MORE ->
                loggedInUser.newsContainer.getNews(10, false)
        }
    }

    fun getReport(): List<ReportItem> {
        return try {
            connect(
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
        } catch (e: Exception) {
            e.printStackTrace()
            listOf()
        }
    }

    fun getPhysicalExaminationResult(): Map<String, String?> {
        return try {
            connect(
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
                    mapOf()
                else {
                    val result = mutableMapOf<String, String?>()
                    result["是否免测"] = json.getString("sfmc")
                    result["免测原因"] = json.getString("mcyy")
                    result["总分"] = json.getString("zf")
                    result["标准分"] = json.getString("bzf")
                    result["附加分"] = json.getString("fjf")
                    result["长跑附加分"] = json.getString("cpfjf")
                    result["身高"] = json.getString("sg")
                    result["体重"] = json.getString("tz")
                    result["身高体重分数"] = json.getString("sgtzfs")
                    result["肺活量"] = json.getString("fhl")
                    result["肺活量分数"] = json.getString("fhltzfs")
                    result["800M跑"] = json.getString("bbmp")
                    result["800M跑分数"] = json.getString("bbmpfs")
                    result["1000M跑"] = json.getString("yqmp")
                    result["1000M跑分数"] = json.getString("yqmpfs")
                    result["50M跑"] = json.getString("wsmp")
                    result["50M跑分数"] = json.getString("wsmpfs")
                    result["立定跳远"] = json.getString("ldty")
                    result["立定跳远分数"] = json.getString("ldtyfs")
                    result["坐位体前屈"] = json.getString("zwtqq")
                    result["坐位体前屈分数"] = json.getString("zwtqqfs")
                    result["仰卧起坐"] = json.getString("ywqz")
                    result["仰卧起坐分数"] = json.getString("ywqzfs")
                    result["引体向上"] = json.getString("ytxs")
                    result["引体向上分数"] = json.getString("ytxsfs")
                    result["体育课成绩"] = json.getString("tykcj")
                    result
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            mapOf()
        }
    }

    fun getJoggingRecord(): List<JoggingRecord> {
        return try {
            connect(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/tyjx.tyjx_kw_xscjb.do?m=queryXsCjAll",
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/jxmh.do?url=jxmh.do&m=bks_tyjx_tcyy",
                loggedInUser.vpnTicket
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this, "GBK"))
                val stringBuilder = StringBuilder()
                var readLine: String?
                while (reader.readLine().also { readLine = it } != null)
                    stringBuilder.append(readLine!!).append('\n')
                Jsoup.parse(stringBuilder.toString()).getElementsByClass("table_list")[0].child(0).children().drop(1)
                    .map {
                        JoggingRecord(
                            it.child(0).ownText(),
                            it.child(4).ownText().toInt(),
                            it.child(5).ownText().toInt(),
                            it.child(6).ownText().toInt()
                        )
                    }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            listOf()
        }
    }

    fun loseCard(): Int? {
        try {
            connect(
                "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a/user/RambleConsumeLog.do?losscard=true",
                null,
                loggedInUser.vpnTicket
            ).inputStream.run {
                val reader = BufferedReader(InputStreamReader(this))
                var readLine: String?
                while (reader.readLine().also { readLine = it } != null) {
                    if (readLine!!.contains("var result")) {
                        readLine = readLine!!.substring(readLine!!.indexOf('=') + 1).trim()
                        return if (readLine == "null") null else readLine?.toInt()
                    }
                }
                return null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    fun getClassroomState(classroom: String, week: Int): List<Pair<String, List<Int>>> {
        return try {
            connect(
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
                    .map { (it.child(0).ownText() to it.children().drop(1).map(::mapClassName)) }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            listOf()
        }
    }

    fun logout() {
        connect(
            "https://webvpn.tsinghua.edu.cn/logout",
            null,
            loggedInUser.vpnTicket
        )
    }

    companion object {
        enum class MODE { NONE, REFRESH, MORE }
    }

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