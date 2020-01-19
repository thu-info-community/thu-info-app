package com.unidy2002.thuinfo.data.lib

import android.content.Context
import android.os.AsyncTask
import android.util.Log
import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONObject
import com.unidy2002.thuinfo.data.model.*
import com.unidy2002.thuinfo.data.model.report.CourseScore
import com.unidy2002.thuinfo.ui.login.LoginActivity
import jxl.Workbook
import org.jsoup.Jsoup
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

class Network {

    private val loggedInUser: LoggedInUser
        get() = LoginActivity.loginViewModel.getLoggedInUser()

    internal data class ConnectParams(
        val url: String,
        val host: String,
        val referer: String?,
        val cookie: String?,
        val doInput: Boolean,
        val post: String? = null
    ) {
        fun connect() {
            Connect().execute(this)
            synchronized(lock) { lock.wait() }
        }
    }

    internal class Connect : AsyncTask<ConnectParams, Void, HttpURLConnection?>() {
        override fun onPreExecute() {}

        override fun doInBackground(vararg params: ConnectParams): HttpURLConnection? {
            val connectParams = params[0]
            return try {
                val userAgent =
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36"
                val connection = URL(connectParams.url).openConnection() as HttpURLConnection
                connection.setRequestProperty("User-Agent", userAgent)
                connection.setRequestProperty("Host", connectParams.host)
                connectParams.referer?.run { connection.setRequestProperty("Referer", this) }
                connectParams.cookie?.run { connection.setRequestProperty("Cookie", this) }
                connection.doInput = connectParams.doInput
                if (connectParams.post == null) {
                    connection.requestMethod = "GET"
                    connection.connect()
                } else {
                    connection.doOutput = true
                    connection.requestMethod = "POST"
                    connection.connect()
                    val out = OutputStreamWriter(connection.outputStream, StandardCharsets.UTF_8)
                    out.write(connectParams.post)
                    out.flush()
                    out.close()
                }
                // Log.d("DEBUG", "${connectParams.url} - ${connection.responseCode}")
                cookieReceiver = connection.headerFields["Set-Cookie"]?.toString()?.drop(1)?.dropLast(1)
                if (connectParams.doInput) inputStreamReceiver = connection.inputStream
                connection
            } catch (e: Exception) {
                e.printStackTrace()
                null
            } finally {
                synchronized(lock) { lock.notify() }
            }
        }

        override fun onPostExecute(connection: HttpURLConnection?) {}
    }

    fun getEcard(force: Boolean): Boolean {
        if (force || !loggedInUser.eCardInitialized()) {
            try {
                if (!loggedInUser.eCardInitialized()) {
                    // Connect
                    ConnectParams(
                        loggedInUser.eCardTicket,
                        "webvpn.tsinghua.edu.cn",
                        "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                        loggedInUser.vpnTicket,
                        false
                    ).connect()
                }

                // Parse EXCEL file
                ConnectParams(
                    "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a/user/ExDetailsDown.do",
                    "webvpn.tsinghua.edu.cn",
                    loggedInUser.eCardTicket,
                    loggedInUser.vpnTicket,
                    true
                ).connect()

                val workbook = Workbook.getWorkbook(inputStreamReceiver)
                val sheet = workbook.getSheet(0)
                val rowCount = sheet.rows
                val table = EcardTable()
                for (i in rowCount - 2 downTo 1) {
                    val cells = sheet.getRow(i)
                    table.addElement(
                        cells[1].contents,
                        cells[2].contents,
                        cells[4].contents,
                        cells[5].contents.toDouble()
                    )
                }
                inputStreamReceiver?.close()
                loggedInUser.eCardTable = table
            } catch (e: Exception) {
                e.printStackTrace()
                return false
            }
        }
        return true
    }

    fun getCalender(context: Context) {
        if (!loggedInUser.calenderInitialized()) {
            val dbManager = DBManager.getInstance(context)
            with(dbManager.lessonList) {
                if (isEmpty()) {
                    try {
                        ConnectParams(
                            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/jxmh_out.do?m=bks_jxrl_all&p_start_date=20190901&p_end_date=20200131&jsoncallback=m",
                            "webvpn.tsinghua.edu.cn",
                            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                            loggedInUser.vpnTicket,
                            true
                        ).connect()
                        val reader = BufferedReader(InputStreamReader(inputStreamReceiver!!))
                        val stringBuilder = StringBuilder()
                        var readLine: String?
                        while (reader.readLine().also { readLine = it } != null)
                            stringBuilder.append(readLine)
                        val result =
                            stringBuilder.substring(stringBuilder.indexOf("(") + 1, stringBuilder.lastIndexOf(")"))
                        reader.close()
                        inputStreamReceiver?.close()
                        loggedInUser.calendar = Calendar(result)

                        for (lesson in loggedInUser.calendar.lessonList)
                            dbManager.addLesson(lesson)
                        for (exam in loggedInUser.calendar.examList)
                            dbManager.addExam(exam)
                        for (auto in loggedInUser.calendar.autoShortenMap)
                            dbManager.addAuto(auto.key, auto.value.first, auto.value.second)
                        for (custom in loggedInUser.calendar.customShortenMap)
                            dbManager.addCustom(custom.key, custom.value)
                        for (custom in loggedInUser.calendar.colorMap)
                            dbManager.addColor(custom.key, custom.value)
                    } catch (e: Exception) {
                        loggedInUser.calendar = Calendar(
                            mutableListOf(),
                            mutableListOf(),
                            mutableMapOf(),
                            mutableMapOf(),
                            mutableMapOf()
                        )
                        e.printStackTrace()
                    }
                } else {
                    loggedInUser.calendar =
                        Calendar(
                            this,
                            dbManager.examList,
                            dbManager.autoShortenMap,
                            dbManager.customShortenMap,
                            dbManager.colorMap
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

    fun getReport(): List<CourseScore> {
        return try {
            ConnectParams(
                "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/cj.cjCjbAll.do?m=bks_cjdcx&cjdlx=zw",
                "webvpn.tsinghua.edu.cn",
                "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                loggedInUser.vpnTicket,
                true
            ).connect()

            val reader = BufferedReader(InputStreamReader(inputStreamReceiver!!, "GBK"))
            val stringBuilder = StringBuilder()
            var readLine: String?
            while (reader.readLine().also { readLine = it } != null) {
                stringBuilder.append(readLine).append('\n')
            }
            reader.close()
            inputStreamReceiver?.close()

            fun nullIfNA(string: String): String? = if (string.matches(Regex("\\*+|N/A"))) null else string

            Jsoup.parse(stringBuilder.toString()).getElementById("table1").child(0).children().drop(1).map {
                CourseScore(
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
        } catch (e: Exception) {
            e.printStackTrace()
            listOf()
        }
    }

    fun getPhysicalExaminationResult(): Map<String, String?> {
        return try {
            ConnectParams(
                "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/tyjx.tyjx_tc_xscjb.do?vpn-12-o1-zhjw.cic.tsinghua.edu.cn&m=jsonCj",
                "webvpn.tsinghua.edu.cn",
                "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/tyjx.tyjx_tc_xscjb.do?m=tc_bkscjcx",
                loggedInUser.vpnTicket,
                true
            ).connect()
            val reader = BufferedReader(InputStreamReader(inputStreamReceiver!!, "GBK"))
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
        } catch (e: Exception) {
            e.printStackTrace()
            mapOf()
        }
    }

    fun getJoggingRecord(): List<JoggingRecord> {
        return try {
            ConnectParams(
                "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/tyjx.tyjx_kw_xscjb.do?m=queryXsCjAll",
                "webvpn.tsinghua.edu.cn",
                "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/jxmh.do?url=jxmh.do&m=bks_tyjx_tcyy",
                loggedInUser.vpnTicket,
                true
            ).connect()
            val reader = BufferedReader(InputStreamReader(inputStreamReceiver!!, "GBK"))
            val stringBuilder = StringBuilder()
            var readLine: String?
            while (reader.readLine().also { readLine = it } != null)
                stringBuilder.append(readLine!!).append('\n')
            Jsoup.parse(stringBuilder.toString()).getElementsByClass("table_list")[0].child(0).children().drop(1).map {
                JoggingRecord(
                    it.child(0).ownText(),
                    it.child(4).ownText().toInt(),
                    it.child(5).ownText().toInt(),
                    it.child(6).ownText().toInt()
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
            listOf()
        }
    }

    fun loseCard(): Int? {
        try {
            ConnectParams(
                "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a/user/RambleConsumeLog.do?losscard=true",
                "webvpn.tsinghua.edu.cn",
                null,
                loggedInUser.vpnTicket,
                true
            ).connect()
            val reader = BufferedReader(InputStreamReader(inputStreamReceiver!!))
            var readLine: String?
            while (reader.readLine().also { readLine = it } != null) {
                if (readLine!!.contains("var result")) {
                    readLine = readLine!!.substring(readLine!!.indexOf('=') + 1).trim()
                    return if (readLine == "null") null else readLine?.toInt()
                }
            }
            return null
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    fun login(loggedInUser: LoggedInUser, password: String) {
        // Get vpn ticket
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/login",
            "webvpn.tsinghua.edu.cn",
            null,
            null,
            false
        ).connect()
        loggedInUser.vpnTicket = cookieReceiver!!.run { substring(0, this.indexOf(';')) }
        Log.i("VPN TICKET", loggedInUser.vpnTicket)

        // Login to webvpn
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/do-login?local_login=true",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/login",
            loggedInUser.vpnTicket,
            false,
            "auth_type=local&username=${loggedInUser.userId}&sms_code=&password=$password"
        ).connect()

        // Kick if necessary
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/login?local_login=true",
            loggedInUser.vpnTicket,
            true
        ).connect()
        var reader = BufferedReader(InputStreamReader(inputStreamReceiver!!))
        var readLine: String?
        while (reader.readLine().also { readLine = it } != null) {
            if (readLine!!.contains("var logoutOtherToken = ")
                && readLine!!.matches(Regex(".*var logoutOtherToken = '.+'.*"))
            ) {
                readLine = readLine!!.substring(readLine!!.indexOf('\'') + 1)
                readLine = readLine!!.substring(0, readLine!!.indexOf('\''))
                ConnectParams(
                    "http://webvpn.tsinghua.edu.cn/do-confirm-login",
                    "webvpn.tsinghua.edu.cn",
                    "http://webvpn.tsinghua.edu.cn/login?local_login=true",
                    loggedInUser.vpnTicket,
                    false,
                    "username=${loggedInUser.userId}&logoutOtherToken=$readLine"
                ).connect()
                Log.i("KICK", readLine!!)
                break
            }
        }
        reader.close()
        inputStreamReceiver?.close()

        /*var reader: BufferedReader
        var readLine: String?
        loggedInUser.vpnTicket = "wengine_vpn_ticket=**************"*/

        // Login to tsinghua info
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/Login",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/",
            loggedInUser.vpnTicket,
            false,
            "redirect=NO&userName=${loggedInUser.userId}&password=$password&x=0&y=0"
        ).connect()

        // Invalidate zhjw session
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/servlet/InvalidateSession",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/",
            loggedInUser.vpnTicket,
            false
        ).connect()

        // Get username
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/minichan/roamaction.jsp?id=2612",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/minichan/bks_grzm.jsp",
            loggedInUser.vpnTicket,
            true
        ).connect()
        loggedInUser.displayName = ""
        reader = BufferedReader(InputStreamReader(inputStreamReceiver!!, "GBK"))
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
                inputStreamReceiver?.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // Get the tickets
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/prelogin.jsp?result=1",
            loggedInUser.vpnTicket,
            true
        ).connect()
        reader = BufferedReader(InputStreamReader(inputStreamReceiver!!))
        try {
            while (reader.readLine().also { readLine = it } != null) {
                if (readLine!!.contains("a name=\"9-824\"")) {
                    loggedInUser.eCardTicket =
                        readLine!!.substring(
                            readLine!!.indexOf("src") + 5,
                            readLine!!.indexOf("\" id=\"9-824")
                        )
                            .replace("amp;", "")
                    Log.i("ECARD TICKET", loggedInUser.eCardTicket)
                } else if (readLine!!.contains("a name=\"9-792\"")) {
                    // Link user with zhjw
                    with(
                        readLine!!.substring(
                            readLine!!.indexOf("src") + 5, readLine!!.indexOf("\" id=\"9-792")
                        ).replace("amp;", "")
                    ) {
                        ConnectParams(
                            this,
                            "webvpn.tsinghua.edu.cn",
                            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                            loggedInUser.vpnTicket,
                            false
                        ).connect()
                        Log.i("ZHJW TICKET", this)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            try {
                reader.close()
                inputStreamReceiver!!.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    companion object {
        val lock = Object()
        var cookieReceiver: String? = null
        var inputStreamReceiver: InputStream? = null

        enum class MODE { NONE, REFRESH, MORE }
    }
}