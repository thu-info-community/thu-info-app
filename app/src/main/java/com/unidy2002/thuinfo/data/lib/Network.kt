package com.unidy2002.thuinfo.data.lib

import android.content.Context
import android.os.AsyncTask
import android.util.Log
import com.unidy2002.thuinfo.data.model.Calendar
import com.unidy2002.thuinfo.data.model.EcardTable
import com.unidy2002.thuinfo.data.model.LoggedInUser
import com.unidy2002.thuinfo.ui.login.LoginActivity
import jxl.Workbook
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
                connection.doInput = true
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
                connectionReceiver = connection
                cookieReceiver = connection.headerFields["Set-Cookie"]?.toString()?.drop(1)?.dropLast(1)
                inputStreamReceiver = connection.inputStream
                synchronized(lock) { lock.notify() }
                connection
            } catch (e: Exception) {
                e.printStackTrace()
                null
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
                        loggedInUser.vpnTicket
                    ).connect()
                }

                // Parse EXCEL file
                ConnectParams(
                    "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a/user/ExDetailsDown.do",
                    "webvpn.tsinghua.edu.cn",
                    loggedInUser.eCardTicket,
                    loggedInUser.vpnTicket
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
                inputStreamReceiver!!.close()
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
                    if (loggedInUser.calenderTicket != "") {
                        // Link user with zhjw
                        ConnectParams(
                            loggedInUser.calenderTicket,
                            "webvpn.tsinghua.edu.cn",
                            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                            loggedInUser.vpnTicket
                        ).connect()

                        // Get calender
                        ConnectParams(
                            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/jxmh_out.do?m=bks_jxrl_all&p_start_date=20190901&p_end_date=20200131&jsoncallback=m",
                            "webvpn.tsinghua.edu.cn",
                            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
                            loggedInUser.vpnTicket
                        ).connect()

                        try {
                            val calenderReader =
                                BufferedReader(InputStreamReader(inputStreamReceiver!!, StandardCharsets.UTF_8))
                            val stringBuilder = StringBuilder()
                            var readLine: String?
                            while (calenderReader.readLine().also { readLine = it } != null)
                                stringBuilder.append(readLine)
                            println(stringBuilder)
                            val result =
                                stringBuilder.substring(stringBuilder.indexOf("(") + 1, stringBuilder.lastIndexOf(")"))
                            inputStreamReceiver!!.close()
                            calenderReader.close()
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
                            e.printStackTrace()
                        }
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

    fun login(loggedInUser: LoggedInUser, password: String) {
        loggedInUser.displayName = ""

        // Get vpn ticket
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/login",
            "webvpn.tsinghua.edu.cn",
            null,
            null
        ).connect()
        loggedInUser.vpnTicket = cookieReceiver!!.run { substring(0, this.indexOf(';')) }
        Log.i("VPN TICKET", loggedInUser.vpnTicket)

        // Login to webvpn
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/do-login?local_login=true",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/login",
            loggedInUser.vpnTicket,
            "auth_type=local&username=${loggedInUser.userId}&sms_code=&password=$password"
        ).connect()

        // Kick if necessary
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/login?local_login=true",
            loggedInUser.vpnTicket
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
                    "username=${loggedInUser.userId}&logoutOtherToken=$readLine"
                ).connect()
                Log.i("KICK", readLine!!)
                break
            }
        }

        // Login to tsinghua info
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/https-443/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/Login",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/",
            "${loggedInUser.vpnTicket}; refresh=1",
            "redirect=NO&userName=${loggedInUser.userId}&password=$password&x=0&y=0"
        ).connect()

        // Get the tickets
        ConnectParams(
            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/render.userLayoutRootNode.uP",
            "webvpn.tsinghua.edu.cn",
            "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f9f9479369247b59700f81b9991b2631506205de/prelogin.jsp?result=1",
            "${loggedInUser.vpnTicket}; refresh=1"
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
                    loggedInUser.calenderTicket =
                        readLine!!.substring(
                            readLine!!.indexOf("src") + 5,
                            readLine!!.indexOf("\" id=\"9-792")
                        )
                            .replace("amp;", "")
                    Log.i("CALEN TICKET", loggedInUser.calenderTicket)
                }
            }
        } catch (e: Exception) {
            loggedInUser.eCardTicket = ""
            loggedInUser.calenderTicket = ""
            e.printStackTrace()
        } finally {
            try {
                inputStreamReceiver!!.close()
                reader.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    companion object {
        val lock = Object()
        var cookieReceiver: String? = null
        var connectionReceiver: HttpURLConnection? = null
        var inputStreamReceiver: InputStream? = null

        enum class MODE { NONE, REFRESH, MORE }
    }
}