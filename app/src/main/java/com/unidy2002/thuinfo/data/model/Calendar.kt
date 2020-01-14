package com.unidy2002.thuinfo.data.model

import com.alibaba.fastjson.JSON.parseArray
import com.alibaba.fastjson.JSONObject
import com.huaban.analysis.jieba.JiebaSegmenter
import java.sql.Date
import java.sql.Time


class Calendar {

    data class Lesson(
        var title: String,
        var abbr: String,
        var locale: String,
        var date: Date,
        var begin: Int,
        var end: Int
    )

    val lessonList: MutableList<Lesson>

    data class Exam(
        var title: String,
        var abbr: String,
        var locale: String,
        var date: Date,
        var begin: Time,
        var end: Time
    )

    val examList: MutableList<Exam>

    val autoShortenMap: MutableMap<String, Pair<Boolean, String>>

    val customShortenMap: MutableMap<String, String>

    val colorMap: MutableMap<String, Int>

    private lateinit var segmenter: JiebaSegmenter

    private val stopWord = setOf("的", "基础")

    private val avoidEnd = setOf('与', '和', '以', '及')

    private val maxLength = 7

    private val colorCount = 7

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
        lessonList: MutableList<Lesson>,
        examList: MutableList<Exam>,
        autoShortenMap: MutableMap<String, Pair<Boolean, String>>,
        customShortenMap: MutableMap<String, String>,
        colorMap: MutableMap<String, Int>
    ) {
        this.lessonList = lessonList
        this.examList = examList
        this.autoShortenMap = autoShortenMap
        this.customShortenMap = customShortenMap
        this.colorMap = colorMap
    }

    constructor(source: String) {
        val jsonArray = parseArray(source)
        segmenter = JiebaSegmenter()
        lessonList = mutableListOf()
        examList = mutableListOf()
        autoShortenMap = mutableMapOf()
        customShortenMap = mutableMapOf()
        colorMap = mutableMapOf()
        for (e in jsonArray) {
            try {
                val o = e as JSONObject
                when (o["fl"] as String) {
                    "上课" -> {
                        val title = o["nr"] as String
                        val locale = shortenLocale(o["dd"] as? String ?: "网络异常")
                        val date = Date.valueOf(o["nq"] as String)
                        val begin = parseBegin(o["kssj"] as String)
                        val end = parseEnd(o["jssj"] as String)
                        if (lessonList.isNotEmpty() &&
                            title == lessonList.last().title &&
                            locale == lessonList.last().locale &&
                            date == lessonList.last().date &&
                            begin <= lessonList.last().end + 1
                        ) {
                            lessonList.last().end = end
                        } else {
                            lessonList.add(
                                Lesson(
                                    title,
                                    shortenTitle(title),
                                    locale,
                                    date,
                                    begin,
                                    end
                                )
                            )
                        }
                        if (colorMap[title] == null) {
                            colorMap[title] = colorMap.size % colorCount
                        }
                    }
                    "考试" ->
                        examList.add(
                            Exam(
                                o["nr"] as String,
                                shortenTitle(o["nr"] as String),
                                shortenLocale(o["dd"] as? String ?: "网络异常"),
                                Date.valueOf(o["nq"] as String),
                                Time.valueOf(o["kssj"] as String + ":00"),
                                Time.valueOf(o["jssj"] as String + ":00")
                            )
                        )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
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

    private fun shortenTitle(name: String): String {
        return customShortenMap[name] ?: with(autoShortenMap[name]) {
            if (this == null) {
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
                    val segmented = segmenter.sentenceProcess(temp)
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
                temp = customShortenMap[temp] ?: temp
                autoShortenMap[name] = Pair(true, temp)
                temp
            } else {
                if (this.first) {
                    this.second
                } else {
                    customShortenMap[name] ?: name
                }
            }
        }
    }

    private fun shortenLocale(name: String): String {
        return name
            .replace(Regex(".教|[\\s]"), "")
    }
}
