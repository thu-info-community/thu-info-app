package com.unidy2002.thuinfo.data.network

import android.util.Log
import com.unidy2002.thuinfo.data.dao.ScheduleDBManager.Lesson
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.util.SchoolCalendar
import com.unidy2002.thuinfo.data.util.SchoolCalendar.Companion.semesterId
import org.jsoup.Jsoup
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.URLEncoder.encode
import java.text.SimpleDateFormat
import java.util.*
import kotlin.concurrent.thread

private fun Network.getSecondary() = mutableListOf<Lesson>().apply {
    val begin = listOf(1, 3, 6, 8, 10, 12)
    val end = listOf(2, 5, 7, 9, 11, 14)
    try {
        fun update(position: String, data: String) {
            fun parse(title: String, week: Int) {
                add(
                    Lesson(
                        title,
                        "",
                        Date(SchoolCalendar(week, position[3] - '0').timeInMillis),
                        begin[position[1] - '1'],
                        end[position[1] - '1']
                    )
                )
            }
            Jsoup.parseBodyFragment(data).body().run {
                val title = child(0).text()
                val detail = ownText().replace(Regex("\\s"), "")
                val patterns = listOf(Regex("第[0-9]+周"), Regex("第[0-9]+[-~][0-9]+周"), Regex("[-~]"))
                patterns[0].find(detail)?.run {
                    parse(title, value.drop(1).dropLast(1).toInt())
                } ?: patterns[1].find(detail)?.run {
                    value.drop(1).dropLast(1).split('-', '~').takeIf { it.size == 2 }?.run {
                        (get(0).toInt()..get(1).toInt()).forEach { parse(title, it) }
                    }
                } ?: detail.takeIf { it.contains("单周") }?.run {
                    listOf(1, 3, 5, 7, 9, 11, 13, 15).forEach { parse(title, it) }
                } ?: detail.takeIf { it.contains("双周") }?.run {
                    listOf(2, 4, 6, 8, 10, 12, 14, 16).forEach { parse(title, it) }
                }
            }
        }
        // Login to jxmh
        connect(
            "https://webvpn.tsinghua.edu.cn/https/77726476706e69737468656265737421f1f44098223d6153301c9aa596522b2027124ec39c5debe6/Login",
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f1f44098223d6153301c9aa596522b2027124ec39c5debe6",
            loggedInUser.vpnTicket,
            "userName=${loggedInUser.userId}&password=${encode(loggedInUser.password, "UTF-8")}",
            false
        ).inputStream.close()

        // Get course-select ticket
        lateinit var redirect: String
        connect(
            "https://webvpn.tsinghua.edu.cn/http-80/77726476706e69737468656265737421f1f44098223d6153301c9aa596522b2027124ec39c5debe6/render.userLayoutRootNode.uP",
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f1f44098223d6153301c9aa596522b2027124ec39c5debe6",
            loggedInUser.vpnTicket
        ).inputStream.run {
            val reader = BufferedReader(InputStreamReader(this))
            var readLine: String?
            while (reader.readLine().also { readLine = it } != null) {
                if (readLine!!.contains("25-2649_iframe")) {
                    redirect = readLine!!.run { substring(indexOf("src=") + 5, indexOf("\" id=\"25")) }
                        .replace("amp;", "")
                    Log.i("redirect", redirect)
                    break
                }
            }
        }

        // Login to course-select
        connect(
            redirect,
            "https://webvpn.tsinghua.edu.cn/http-80/77726476706e69737468656265737421f1f44098223d6153301c9aa596522b2027124ec39c5debe6/render.userLayoutRootNode.uP",
            loggedInUser.vpnTicket
        ).inputStream.close()

        // Get secondary lesson table
        connect(
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/syxk.vsyxkKcapb.do?m=kbSearch&p_xnxq=$semesterId&pathContent=%B6%FE%BC%B6%D1%A1%BF%CE%BF%CE%B1%ED",
            "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290/xkBks.vxkBksXkbBs.do?m=main",
            loggedInUser.vpnTicket
        ).inputStream.run {
            val reader = BufferedReader(InputStreamReader(this, "gbk"))
            var readLine: String?
            var watching = false
            lateinit var strHTML: String
            while (reader.readLine().also { readLine = it } != null) {
                if (readLine!!.contains("Event.observe") && watching) break
                if (watching) {
                    try {
                        if (readLine!!.contains("getElementById")) {
                            update(
                                readLine!!.run { substring(indexOf('\'') + 1, lastIndexOf('\'')) },
                                strHTML
                            )
                        } else if (readLine!!.contains("strHTML")) {
                            strHTML = readLine!!.run { substring(indexOf('"') + 1, lastIndexOf('"')) }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                if (readLine!!.contains("function setInitValue")) watching = true
            }
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

@Synchronized
fun Network.getSchedule() = retryTemplate(792) {
    val lock = Object()
    val data = MutableList(6) { "" }
    var count = 7

    // Get secondary lesson list
    lateinit var secondaryList: List<Lesson>
    thread {
        Log.i("async", "Secondary started!")
        secondaryList = getSecondary()
        Log.i("async", "Secondary finished!")
        synchronized(count) {
            count--
            if (count == 0) synchronized(lock) { lock.notify() }
        }
    }

    // Get primary lesson list
    (0..5).forEach {
        thread {
            val simpleDateFormat = SimpleDateFormat("yyyyMMdd", Locale.CHINA)
            try {
                Log.i("async", "$it started!")
                data[it] = connect(
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
                Log.i("async", "$it finished!")
            } catch (e: Exception) {
                Log.e("async", "id = $it")
                e.printStackTrace()
            }
            try {
                synchronized(count) {
                    count--
                    if (count == 0) synchronized(lock) { lock.notify() }
                }
            } catch (e: Exception) {
                Log.e("async", "lock $it failed to notify")
                e.printStackTrace()
            }
        }
    }
    synchronized(lock) {
        while (count != 0) {
            try {
                lock.wait()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    loggedInUser.schedule.refresh("[${data.joinToString(",")}]", secondaryList)
    true
} ?: false