package com.unidy2002.thuinfo.data.dao

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.alibaba.fastjson.JSON.parseArray
import com.alibaba.fastjson.JSONObject
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.util.safeThread
import jackmego.com.jieba_android.JiebaSegmenter
import java.sql.Time
import java.text.SimpleDateFormat
import java.util.*
import java.util.Locale.CHINA
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.isAccessible

class ScheduleDBManager private constructor(context: Context) {

    // Initialize database

    private val writableDatabase: SQLiteDatabase = ScheduleDBHelper(context, 1).writableDatabase

    // Write to database

    private fun updateList(tableName: String) {
        writableDatabase.execSQL("DELETE FROM $tableName")
        (ScheduleDBManager::class.java.getDeclaredField(tableName).get(this) as MutableList<*>)
            .filterNotNull().forEach { addItem(it, tableName) }
    }

    @Synchronized
    private fun updatePrimary() {
        updateList("primaryList")
    }

    @Synchronized
    private fun updateSecondary() {
        updateList("secondaryList")
    }

    @Synchronized
    private fun updateExam() {
        updateList("examList")
    }

    private fun addItem(item: Any, tableName: String) {
        writableDatabase.insert(tableName, null, ContentValues().apply {
            item.javaClass.kotlin.memberProperties.forEach {
                it.isAccessible = true
                val name = "j_${it.name}"
                when (val data = it.get(item)) {
                    is String -> put(name, data)
                    is Int -> put(name, data)
                    is Date -> put(name, data.time)
                    is Time -> put(name, data.time)
                }
            }
        })
    }

    // Read from database

    private fun <T> readList(tableName: String, block: Cursor.() -> T) {
        val list = ScheduleDBManager::class.java.getDeclaredField(tableName).get(this) as MutableList<T>
        list.clear()
        writableDatabase.query(tableName, null, null, null, null, null, null, null).apply {
            while (moveToNext()) list.add(block())
            close()
        }
    }

    private fun readLessonList(tableName: String) {
        readList(tableName) { Lesson(getString(0), getString(1), Date(getLong(2)), getInt(3), getInt(4)) }
    }

    private fun readPrimaryList() {
        readLessonList("primaryList")
    }

    private fun readSecondaryList() {
        readLessonList("secondaryList")
    }

    private fun readCustomList() {
        readLessonList("customList")
    }

    private fun readExamList() {
        readList("examList") {
            Exam(getString(0), getString(1), Date(getLong(2)), Time(getLong(3)), Time(getLong(4)))
        }
    }

    private fun <T, S> readMap(tableName: String, pair: Cursor.() -> Pair<T, S>) {
        val map = ScheduleDBManager::class.java.getDeclaredField(tableName).get(this) as MutableMap<T, S>
        map.clear()
        writableDatabase.query(tableName, null, null, null, null, null, null, null).apply {
            while (moveToNext()) pair().run { map[first] = second }
            close()
        }
    }

    private fun readShortenMap() {
        readMap("shortenMap") { getString(0) to getString(1) }
    }

    private fun readColorMap() {
        readMap("colorMap") { getString(0) to getInt(1) }
    }


    // Data classes

    data class Lesson(
        var title: String,
        var locale: String,
        var date: Date,
        var begin: Int,
        var end: Int
    )

    data class Exam(
        var title: String,
        var locale: String,
        var date: Date,
        var begin: Time,
        var end: Time
    )

    // In-memory data

    private var primaryList = mutableListOf<Lesson>()

    private var secondaryList = mutableListOf<Lesson>()

    private val customList = mutableListOf<Lesson>()

    private var examList = mutableListOf<Exam>()

    private val shortenMap = mutableMapOf<String, String>()

    private val colorMap = mutableMapOf<String, Int>()

    // Public methods

    val lessonNames get() = (primaryList + secondaryList).map { it.title }.toMutableSet().toList()

    val allLessonList get() = primaryList + secondaryList + customList

    fun getColor(name: String) = colorMap[name] ?: (colorMap.size % colorCount).also {
        colorMap[name] = it
        safeThread { addItem(name to it, "colorMap") }
    }

    fun abbr(name: String) = shortenMap[name] ?: name

    fun addShorten(origin: String, dest: String) {
        shortenMap[origin] = dest
        safeThread { addItem(origin to dest, "shortenMap") }
    }

    fun addCustom(lesson: Lesson) {
        customList.add(lesson)
        safeThread { addItem(lesson, "customList") }
    }

    init {
        readPrimaryList()
        readSecondaryList()
        readCustomList()
        readExamList()
        readShortenMap()
        readColorMap()
    }

    fun refresh(primary: String, secondary: List<Lesson>) {
        val segmenter = JiebaSegmenter.getJiebaSegmenterSingleton()
        val primaryLessonList = mutableListOf<Lesson>()
        val examList = mutableListOf<Exam>()
        parseArray(primary).forEach {
            try {
                val o = it as JSONObject
                when (o["fl"] as String) {
                    "上课" -> {
                        val title = o["nr"] as String
                        val locale = o["dd"] as? String ?: ""
                        val date = SimpleDateFormat("yyyy-MM-dd", CHINA).parse(o["nq"] as String)!!
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
                                SimpleDateFormat("yyyy-MM-dd", CHINA).parse(o["nq"] as String)!!,
                                Time.valueOf(o["kssj"] as String + ":00"),
                                Time.valueOf(o["jssj"] as String + ":00")
                            )
                        )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        secondary.forEach { shortenTitle(it.title, segmenter) }
        primaryList = primaryLessonList
        secondaryList = secondary.toMutableList()
        this.examList = examList
        safeThread {
            updatePrimary()
            updateSecondary()
            updateExam()
        }
    }

    // Private methods

    private val stopWord = setOf("的", "基础")

    private val avoidEnd = setOf('与', '和', '以', '及')

    private val maxLength = 7

    private val colorCount = context.resources.getIntArray(R.array.schedule_colors).size

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

    private fun shortenTitle(origin: String, segmenter: JiebaSegmenter) {
        if (shortenMap[origin] == null) {
            var dest = origin.replace(Regex("\\(.*\\)|（.*）|[\\s]"), "")
            with(Regex("《.*?》").findAll(dest)) {
                if (this.count() != 0) {
                    dest = ""
                    this.forEach { dest += it.value.drop(1).dropLast(1) }
                }
            }
            with(dest.indexOf("：")) {
                if (this >= 0) dest = dest.substring(0, this)
            }
            with(dest.indexOf(":")) {
                if (this >= 0) dest = dest.substring(0, this)
            }
            with(dest.indexOf("—")) {
                if (this >= 0) dest = dest.substring(0, this)
            }
            with(dest.indexOf("-")) {
                if (this >= 2) dest = dest.substring(0, this)
            }
            dest = dest.replace(Regex("[A-Za-z0-9]*$"), "")
            if (dest.length > maxLength) {
                val segmented = segmenter.getDividedString(dest)
                segmented.removeAll(stopWord)
                if (segmented.isNotEmpty()) {
                    dest = segmented[0]
                    var pos = 1
                    while (pos < segmented.size && dest.length + segmented[pos].length <= maxLength)
                        dest += segmented[pos++]
                    while (dest.last() in avoidEnd)
                        dest = dest.dropLast(1)
                }
            }
            addShorten(origin, dest)
        }
    }


    // Singleton initialization

    companion object {
        fun init(context: Context) {
            if (!loggedInUser.scheduleInitialized()) {
                synchronized(ScheduleDBManager::class.java) {
                    if (!loggedInUser.scheduleInitialized()) {
                        loggedInUser.schedule = ScheduleDBManager(context)
                    }
                }
            }
        }
    }

    private class ScheduleDBHelper(context: Context, version: Int) :
        SQLiteOpenHelper(context, "calender.${loggedInUser.userId}.db", null, version) {
        override fun onCreate(db: SQLiteDatabase) {
            db.execSQL("create table primaryList(j_title String, j_locale String, j_date Long, j_begin Integer, j_end Integer)")
            db.execSQL("create table secondaryList(j_title String, j_locale String, j_date Long, j_begin Integer, j_end Integer)")
            db.execSQL("create table customList(j_title String, j_locale String, j_date Long, j_begin Integer, j_end Integer)")
            db.execSQL("create table examList(j_title String, j_locale String, j_date Long, j_begin Long, j_end Long)")
            db.execSQL("create table shortenMap(j_first String, j_second String)")
            db.execSQL("create table colorMap(j_first String, j_second Integer)")
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}
    }
}