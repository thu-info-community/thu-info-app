package com.unidy2002.thuinfo.data.model.schedule

import com.alibaba.fastjson.JSON.parseArray
import com.alibaba.fastjson.JSONObject
import com.unidy2002.thuinfo.data.dao.ScheduleDBManager
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import jackmego.com.jieba_android.JiebaSegmenter
import java.sql.Time
import java.text.SimpleDateFormat
import java.util.*

class Schedule {
    data class Lesson(
        var title: String,
        var locale: String,
        var date: Date,
        var begin: Int,
        var end: Int
    )

    val primaryLessonList: MutableList<Lesson>
    val secondaryLessonList: MutableList<Lesson>
    val customLessonList: MutableList<Lesson>
    val autoLessonList get() = primaryLessonList + secondaryLessonList
    val allLessonList get() = primaryLessonList + secondaryLessonList + customLessonList

    data class Exam(
        var title: String,
        var locale: String,
        var date: Date,
        var begin: Time,
        var end: Time
    )

    val examList: MutableList<Exam>

    val shortenMap: MutableMap<String, String>

    val colorMap: MutableMap<String, Int>

    fun getColor(name: String) = colorMap[name] ?: (colorMap.size % colorCount).also {
        colorMap[name] = it
        ScheduleDBManager.getInstance()?.updateColor(colorMap)
    }

    fun updateShorten() {
        ScheduleDBManager.getInstance()?.updateShorten(shortenMap)
    }

    fun updateCustom() {
        ScheduleDBManager.getInstance()?.updateCustomLesson(customLessonList)
    }

    private val stopWord = setOf("的", "基础")

    private val avoidEnd = setOf('与', '和', '以', '及')

    private val maxLength = 7

    private val colorCount = 27

    private val beginMap = mapOf(
        "08:00" to 1,
        "08:50" to 2,
        "09:50" to 3,
        "10:40" to 4,
        "11:30" to 5,
        "13:30" to 6,
        "14:20" to 7,
        "15:20" to 8,
        "16:10" to 9,
        "17:05" to 10,
        "17:55" to 11,
        "19:20" to 12,
        "20:10" to 13,
        "21:00" to 14
    )

    private val endMap = mapOf(
        "08:45" to 1,
        "09:35" to 2,
        "10:35" to 3,
        "11:25" to 4,
        "12:15" to 5,
        "14:15" to 6,
        "15:05" to 7,
        "16:05" to 8,
        "16:55" to 9,
        "17:50" to 10,
        "18:40" to 11,
        "20:05" to 12,
        "20:55" to 13,
        "21:45" to 14
    )

    constructor(
        primaryLessonList: MutableList<Lesson>,
        secondaryLessonList: MutableList<Lesson>,
        customLessonList: MutableList<Lesson>,
        examList: MutableList<Exam>,
        shortenMap: MutableMap<String, String>,
        colorMap: MutableMap<String, Int>
    ) {
        this.primaryLessonList = primaryLessonList
        this.secondaryLessonList = secondaryLessonList
        this.customLessonList = customLessonList
        this.examList = examList
        this.shortenMap = shortenMap
        this.colorMap = colorMap
    }

    constructor(primary: String, secondary: List<Lesson>) {
        val segmenter = JiebaSegmenter.getJiebaSegmenterSingleton()
        primaryLessonList = mutableListOf()
        secondaryLessonList = mutableListOf()
        examList = mutableListOf()
        if (loggedInUser.scheduleInitialized()) {
            customLessonList = loggedInUser.schedule.customLessonList
            shortenMap = loggedInUser.schedule.shortenMap
            colorMap = loggedInUser.schedule.colorMap
        } else {
            customLessonList = mutableListOf()
            shortenMap = mutableMapOf()
            colorMap = mutableMapOf()
        }
        parseArray(primary).forEach {
            try {
                val o = it as JSONObject
                when (o["fl"] as String) {
                    "上课" -> {
                        val title = o["nr"] as String
                        val locale = o["dd"] as? String ?: ""
                        val date = SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).parse(o["nq"] as String)!!
                        val begin = parseBegin(o["kssj"] as String)
                        val end = parseEnd(o["jssj"] as String)
                        if (primaryLessonList.isNotEmpty() &&
                            title == primaryLessonList.last().title &&
                            locale == primaryLessonList.last().locale &&
                            date == primaryLessonList.last().date &&
                            begin <= primaryLessonList.last().end + 1
                        ) primaryLessonList.last().end = end
                        else primaryLessonList.add(Lesson(title, locale, date, begin, end))
                        shortenTitle(title, segmenter)
                    }
                    "考试" ->
                        examList.add(
                            Exam(
                                (o["nr"] as String),
                                o["dd"] as? String ?: "",
                                SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).parse(o["nq"] as String)!!,
                                Time.valueOf(o["kssj"] as String + ":00"),
                                Time.valueOf(o["jssj"] as String + ":00")
                            )
                        )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        secondary.forEach {
            secondaryLessonList.add(it)
            shortenTitle(it.title, segmenter)
        }
    }

    private fun parseBegin(time: String): Int {
        try {
            return beginMap[time] as Int
        } catch (e: Exception) {
            throw NullPointerException()
        }
    }

    private fun parseEnd(time: String): Int {
        try {
            return endMap[time] as Int
        } catch (e: Exception) {
            throw NullPointerException()
        }
    }

    fun abbr(name: String) = shortenMap[name] ?: name

    private fun shortenTitle(name: String, segmenter: JiebaSegmenter) {
        if (shortenMap[name] == null) {
            var temp = name.replace(Regex("\\(.*\\)|（.*）|[\\s]"), "")
            with(Regex("《.*?》").findAll(temp)) {
                if (this.count() != 0) {
                    temp = ""
                    this.forEach {
                        temp += it.value.drop(1).dropLast(1)
                    }
                }
            }
            with(temp.indexOf("：")) {
                if (this >= 0)
                    temp = temp.substring(0, this)
            }
            with(temp.indexOf(":")) {
                if (this >= 0)
                    temp = temp.substring(0, this)
            }
            with(temp.indexOf("—")) {
                if (this >= 0)
                    temp = temp.substring(0, this)
            }
            with(temp.indexOf("-")) {
                if (this >= 2)
                    temp = temp.substring(0, this)
            }
            temp = temp.replace(Regex("[A-Za-z0-9]*$"), "")
            if (temp.length > maxLength) {
                val segmented = segmenter.getDividedString(temp)
                segmented.removeAll(stopWord)
                if (segmented.isNotEmpty()) {
                    temp = segmented[0]
                    var pos = 1
                    while (pos < segmented.size && temp.length + segmented[pos].length <= maxLength)
                        temp += segmented[pos++]
                    while (temp.last() in avoidEnd)
                        temp = temp.dropLast(1)
                }
            }
            shortenMap[name] = temp
        }
    }
}
