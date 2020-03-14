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

    private fun clearTable(tableName: String) {
        writableDatabase.execSQL("DELETE FROM $tableName")
    }

    @Synchronized
    private fun updatePrimaryLesson() {
        clearTable("primary_lesson")
        mPrimaryLessonList.forEach { addItem(it, "primary_lesson") }
    }

    @Synchronized
    private fun updateSecondaryLesson() {
        clearTable("secondary_lesson")
        mSecondaryLessonList.forEach { addItem(it, "secondary_lesson") }
    }

    @Synchronized
    private fun updateExam() {
        clearTable("exam")
        mExamList.forEach { addItem(it, "exam") }
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

    private fun <T> read(list: MutableList<T>, tableName: String, block: Cursor.() -> T) {
        list.clear()
        writableDatabase.query(tableName, null, null, null, null, null, null, null).apply {
            while (moveToNext()) list.add(block())
            close()
        }
    }

    private fun readLessonList(list: MutableList<Lesson>, tableName: String) {
        read(list, tableName) { Lesson(getString(0), getString(1), Date(getLong(2)), getInt(3), getInt(4)) }
    }

    private fun readExamList() {
        read(mExamList, "exam") {
            Exam(getString(0), getString(1), Date(getLong(2)), Time(getLong(3)), Time(getLong(4)))
        }
    }

    private fun <T, S> read(map: MutableMap<T, S>, tableName: String, pair: Cursor.() -> Pair<T, S>) {
        writableDatabase.query(tableName, null, null, null, null, null, null, null).apply {
            while (moveToNext()) pair().run { map[first] = second }
            close()
        }
    }

    private fun readShortenMap() {
        read(mShortenMap, "shorten") { getString(0) to getString(1) }
    }

    private fun readColorMap() {
        read(mColorMap, "color") { getString(0) to getInt(1) }
    }

    // In-memory data

    data class Lesson(
        var title: String,
        var locale: String,
        var date: Date,
        var begin: Int,
        var end: Int
    )

    private var mPrimaryLessonList = mutableListOf<Lesson>()
    private var mSecondaryLessonList = mutableListOf<Lesson>()
    private val mCustomLessonList = mutableListOf<Lesson>()
    val lessonNames get() = (mPrimaryLessonList + mSecondaryLessonList).map { it.title }.toMutableSet().toList()
    val allLessonList get() = mPrimaryLessonList + mSecondaryLessonList + mCustomLessonList

    data class Exam(
        var title: String,
        var locale: String,
        var date: Date,
        var begin: Time,
        var end: Time
    )

    private var mExamList = mutableListOf<Exam>()

    private val mShortenMap = mutableMapOf<String, String>()

    private val mColorMap = mutableMapOf<String, Int>()

    // Public methods

    fun getColor(name: String) = mColorMap[name] ?: (mColorMap.size % colorCount).also {
        mColorMap[name] = it
        safeThread { addItem(name to it, "color") }
    }

    fun addShorten(origin: String, dest: String) {
        mShortenMap[origin] = dest
        safeThread { addItem(origin to dest, "shorten") }
    }

    fun addCustom(lesson: Lesson) {
        mCustomLessonList.add(lesson)
        safeThread { addItem(lesson, "custom_lesson") }
    }

    init {
        readLessonList(mPrimaryLessonList, "primary_lesson")
        readLessonList(mSecondaryLessonList, "secondary_lesson")
        readLessonList(mCustomLessonList, "custom_lesson")
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
        mPrimaryLessonList = primaryLessonList
        mSecondaryLessonList = secondary.toMutableList()
        mExamList = examList
        safeThread {
            updatePrimaryLesson()
            updateSecondaryLesson()
            updateExam()
        }
    }

    fun abbr(name: String) = mShortenMap[name] ?: name

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

    private fun shortenTitle(name: String, segmenter: JiebaSegmenter) {
        if (mShortenMap[name] == null) {
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
            addShorten(name, temp)
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
            db.execSQL("create table primary_lesson(j_title String, j_locale String, j_date Long, j_begin Integer, j_end Integer)")
            db.execSQL("create table secondary_lesson(j_title String, j_locale String, j_date Long, j_begin Integer, j_end Integer)")
            db.execSQL("create table custom_lesson(j_title String, j_locale String, j_date Long, j_begin Integer, j_end Integer)")
            db.execSQL("create table exam(j_title String, j_locale String, j_date Long, j_begin Long, j_end Long)")
            db.execSQL("create table shorten(j_first String, j_second String)")
            db.execSQL("create table color(j_first String, j_second Integer)")
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}
    }
}