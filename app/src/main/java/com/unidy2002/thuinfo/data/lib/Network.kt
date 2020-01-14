package com.unidy2002.thuinfo.data.lib

import android.content.Context
import android.os.AsyncTask
import android.util.Log
import com.unidy2002.thuinfo.data.model.Calendar
import com.unidy2002.thuinfo.data.model.EcardTable
import com.unidy2002.thuinfo.data.model.LoggedInUser
import com.unidy2002.thuinfo.userModel
import jxl.Workbook
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import kotlin.concurrent.thread

class Network {
    internal class Connect : AsyncTask<String?, Void, HttpURLConnection?>() {
        override fun onPreExecute() {}

        override fun doInBackground(vararg params: String?): HttpURLConnection? {
            return try {
                val userAgent =
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36"
                val connection = URL(params[0]).openConnection() as HttpURLConnection
                connection.setRequestProperty("User-Agent", userAgent)
                connection.setRequestProperty("Host", params[1])
                params[2]?.apply { connection.setRequestProperty("Referer", this) }
                connection.setRequestProperty("Cookie", params[3])
                connection.doInput = true
                if (params.size < 5) {
                    connection.requestMethod = "GET"
                    connection.connect()
                } else {
                    connection.doOutput = true
                    connection.requestMethod = "POST"
                    connection.connect()
                    val out = OutputStreamWriter(connection.outputStream, StandardCharsets.UTF_8)
                    out.write(params[4] as String)
                    out.flush()
                    out.close()
                }
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
        if (force || !userModel.eCardInitialized()) {
            try {
                if (!userModel.eCardInitialized()) {
                    // Connect
                    Connect().execute(
                        userModel.eCardTicket, "ecard.tsinghua.edu.cn",
                        "http://info.tsinghua.edu.cn/render.userLayoutRootNode.uP", ""
                    )
                    getLock()

                    userModel.eCardCookie = cookieReceiver!!
                        .replace(" path=/", "")
                        .replace(",", "")
                    Log.i("ECARD COOKIE", userModel.eCardCookie)
                }

                // Parse EXCEL file
                Connect().execute(
                    "http://ecard.tsinghua.edu.cn/user/ExDetailsDown.do", "ecard.tsinghua.edu.cn",
                    userModel.eCardTicket, userModel.eCardCookie
                )
                getLock()

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
                userModel.eCardTable = table
            } catch (e: Exception) {
                e.printStackTrace()
                return false
            }
        }
        return true
    }

    fun getCalender(context: Context) {
        if (!userModel.calenderInitialized()) {
            val dbManager = DBManager.getInstance(context)
            with(dbManager.lessonList) {
                if (isEmpty()) {
                    if (userModel.calenderTicket != "") {
                        // Link user with zhjw
                        Connect().execute(
                            userModel.calenderTicket, "zhjw.cic.tsinghua.edu.cn",
                            null, userModel.zhjwSessionId
                        )
                        getLock()

                        // Get calender
                        Connect().execute(
                            "http://zhjw.cic.tsinghua.edu.cn/jxmh_out.do?m=bks_jxrl_all&p_start_date=20190901&p_end_date=20200131&jsoncallback=m",
                            "zhjw.cic.tsinghua.edu.cn",
                            "http://info.tsinghua.edu.cn/render.userLayoutRootNode.uP",
                            userModel.zhjwSessionId
                        )
                        getLock()

                        try {
                            val calenderReader =
                                BufferedReader(InputStreamReader(inputStreamReceiver!!, StandardCharsets.UTF_8))
                            val stringBuilder = StringBuilder()
                            var readLine: String?
                            while (calenderReader.readLine().also { readLine = it } != null)
                                stringBuilder.append(readLine)
                            val result =
                                stringBuilder.substring(stringBuilder.indexOf("(") + 1, stringBuilder.lastIndexOf(")"))
                            inputStreamReceiver!!.close()
                            calenderReader.close()
                            userModel.calendar = Calendar(result)

                            for (lesson in userModel.calendar.lessonList)
                                dbManager.addLesson(lesson)
                            for (exam in userModel.calendar.examList)
                                dbManager.addExam(exam)
                            for (auto in userModel.calendar.autoShortenMap)
                                dbManager.addAuto(auto.key, auto.value.first, auto.value.second)
                            for (custom in userModel.calendar.customShortenMap)
                                dbManager.addCustom(custom.key, custom.value)
                            for (custom in userModel.calendar.colorMap)
                                dbManager.addColor(custom.key, custom.value)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                } else {
                    userModel.calendar =
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
                userModel.newsContainer.getNews(10, false)
            MODE.REFRESH ->
                userModel.newsContainer.getNews(10, true)
            MODE.MORE ->
                userModel.newsContainer.getNews(10, false)
        }
    }

    companion object {
        val lock = Object()
        var cookieReceiver: String? = null
        var connectionReceiver: HttpURLConnection? = null
        var inputStreamReceiver: InputStream? = null
        private fun getLock() {
            try {
                synchronized(lock) { lock.wait() }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        enum class MODE {
            NONE, REFRESH, MORE
        }

        fun login(loggedInUser: LoggedInUser, password: String) {
            loggedInUser.displayName = ""

            // Login to tsinghua info
            Connect().execute(
                "https://info.tsinghua.edu.cn/Login",
                "info.tsinghua.edu.cn",
                "http://info.tsinghua.edu.cn/index.jsp",
                "",
                "redirect=NO&userName=" + loggedInUser.userId + "&password=" + password + "&x=0&y=0"
            )
            getLock()

            with(cookieReceiver!!.indexOf("UPORTAL")) {
                loggedInUser.loginCookie = cookieReceiver!!.substring(this, cookieReceiver!!.indexOf(";", this))
            }
            inputStreamReceiver!!.close()
            //loggedInUser.loginCookie = "UPORTALINFONEW=confuseconfuseconfuse"
            Log.i("LOGIN COOKIE", loggedInUser.loginCookie)

            // Get zhjw session id
            Connect().execute(
                "http://zhjw.cic.tsinghua.edu.cn/servlet/InvalidateSession", "zhjw.cic.tsinghua.edu.cn",
                "http://info.tsinghua.edu.cn/", ""
            )
            getLock()

            loggedInUser.zhjwSessionId = cookieReceiver!!
            inputStreamReceiver!!.close()
            Log.i("ZHJW SESSION", loggedInUser.zhjwSessionId)

            // Get the tickets
            Connect().execute(
                "http://info.tsinghua.edu.cn/render.userLayoutRootNode.uP?uP_sparam=focusedTabID&focusedTabID=2&uP_sparam=mode&mode=view&_meta_focusedId=2",
                "info.tsinghua.edu.cn", "http://info.tsinghua.edu.cn/login_choice.jsp", loggedInUser.loginCookie
            )
            getLock()

            thread(start = true) {
                val reader = BufferedReader(InputStreamReader(inputStreamReceiver!!, StandardCharsets.UTF_8))
                try {
                    var readLine: String?
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
        }
    }
}