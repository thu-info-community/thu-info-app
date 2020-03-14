package com.unidy2002.thuinfo.data.dao

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.alibaba.fastjson.JSON.parseArray
import com.alibaba.fastjson.JSONObject
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.util.safeThread
import jackmego.com.jieba_android.JiebaSegmenter
import java.sql.Time
import java.text.SimpleDateFormat
import java.util.*
import java.util.Locale.CHINA

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
        mPrimaryLessonList.forEach { addLesson(it, "primary_lesson") }
    }

    @Synchronized
    private fun updateSecondaryLesson() {
        clearTable("secondary_lesson")
        mSecondaryLessonList.forEach { addLesson(it, "secondary_lesson") }
    }

    private fun addLesson(lesson: Lesson, tableName: String) {
        writableDatabase.insert(tableName, null, ContentValues().apply {
            put("title", lesson.title)
            put("locale", lesson.locale)
            put("date", lesson.date.time)
            put("beginning", lesson.begin)
            put("ending", lesson.end)
        })
    }

    @Synchronized
    private fun updateExam() {
        clearTable("exam")
        mExamList.forEach {
            writableDatabase.insert("exam", null, ContentValues().apply {
                put("title", it.title)
                put("locale", it.locale)
                put("date", it.date.time)
                put("beginning", it.begin.time)
                put("ending", it.end.time)
            })
        }
    }

    private fun addShortenToDB(origin: String, dest: String) {
        writableDatabase.insert("shorten", null, ContentValues().apply {
            put("origin", origin)
            put("dest", dest)
        })
    }

    private fun addColor(name: String, id: Int) {
        writableDatabase.insert("color", null, ContentValues().apply {
            put("name", name)
            put("id", id)
        })
    }

    // Read from database

    private fun getLessonList(tableName: String) =
        mutableListOf<Lesson>().apply {
            writableDatabase.query(tableName, null, null, null, null, null, null, null).apply {
                while (moveToNext())
                    add(Lesson(getString(0), getString(1), Date(getLong(2)), getInt(3), getInt(4)))
                close()
            }
        }

    private val examList
        get() = mutableListOf<Exam>().apply {
            writableDatabase.query("exam", null, null, null, null, null, null, null).apply {
                while (moveToNext())
                    add(Exam(getString(0), getString(1), Date(getLong(2)), Time(getLong(3)), Time(getLong(4))))
                close()
            }
        }

    private val shortenMap
        get() = mutableMapOf<String, String>().apply {
            writableDatabase.query("shorten", null, null, null, null, null, null, null).apply {
                while (moveToNext()) put(getString(0), getString(1))
                close()
            }
        }

    private val colorMap
        get() = mutableMapOf<String, Int>().apply {
            writableDatabase.query("color", null, null, null, null, null, null, null).apply {
                while (moveToNext()) put(getString(0), getInt(1))
                close()
            }
        }


    // In-memory data

    data class Lesson(
        var title: String,
        var locale: String,
        var date: Date,
        var begin: Int,
        var end: Int
    )

    private var mPrimaryLessonList: MutableList<Lesson>
    private var mSecondaryLessonList: MutableList<Lesson>
    private val mCustomLessonList: MutableList<Lesson>
    val lessonNames get() = (mPrimaryLessonList + mSecondaryLessonList).map { it.title }.toMutableSet().toList()
    val allLessonList get() = mPrimaryLessonList + mSecondaryLessonList + mCustomLessonList

    data class Exam(
        var title: String,
        var locale: String,
        var date: Date,
        var begin: Time,
        var end: Time
    )

    private var mExamList: MutableList<Exam>

    private val mShortenMap: MutableMap<String, String>

    private val mColorMap: MutableMap<String, Int>

    // Public methods

    fun getColor(name: String) = mColorMap[name] ?: (mColorMap.size % colorCount).also {
        mColorMap[name] = it
        safeThread { addColor(name, it) }
    }

    fun addShorten(origin: String, dest: String) {
        mShortenMap[origin] = dest
        safeThread { addShortenToDB(origin, dest) }
    }

    fun addCustom(lesson: Lesson) {
        mCustomLessonList.add(lesson)
        safeThread { addLesson(lesson, "custom_lesson") }
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

    init {
        mPrimaryLessonList = getLessonList("primary_lesson")
        mSecondaryLessonList = getLessonList("secondary_lesson")
        mCustomLessonList = getLessonList("custom_lesson")
        mExamList = examList
        mShortenMap = shortenMap
        mColorMap = colorMap
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

    fun abbr(name: String) = mShortenMap[name] ?: name

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
            db.execSQL("create table primary_lesson(title String, locale String, date Long, beginning Integer, ending Integer)")
            db.execSQL("create table secondary_lesson(title String, locale String, date Long, beginning Integer, ending Integer)")
            db.execSQL("create table custom_lesson(title String, locale String, date Long, beginning Integer, ending Integer)")
            db.execSQL("create table exam(title String, locale String, date Long, beginning Long, ending Long)")
            db.execSQL("create table shorten(origin String, dest String)")
            db.execSQL("create table color(name String, id Integer)")
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}
    }
}