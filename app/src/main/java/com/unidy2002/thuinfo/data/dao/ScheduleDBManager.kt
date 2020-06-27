package com.unidy2002.thuinfo.data.dao

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log
import com.alibaba.fastjson.JSON.parseArray
import com.alibaba.fastjson.JSONObject
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.util.SchoolCalendar
import com.unidy2002.thuinfo.data.util.safeThread
import jackmego.com.jieba_android.JiebaSegmenter
import java.sql.Time
import java.util.*
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.isAccessible

class ScheduleDBManager private constructor(context: Context) {

    // Initialize database

    private val writableDatabase: SQLiteDatabase = ScheduleDBHelper(context).writableDatabase

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
        readList(tableName) { Lesson(getString(0), getString(1), getInt(2), getInt(3), getInt(4), getInt(5)) }
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
            Exam(getString(0), getString(1), getInt(2), getInt(3), Time(getLong(4)), Time(getLong(5)))
        }
    }

    private fun readHiddenList() {
        readList("hiddenList") {
            HiddenRule(getInt(0), getString(1), getInt(2), getInt(3), getInt(4), getInt(5))
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

    private fun load() {
        try {
            readPrimaryList()
            readSecondaryList()
            readCustomList()
            readExamList()
            readShortenMap()
            readColorMap()
            readHiddenList()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun close() {
        writableDatabase.close()
    }

    // Data and enum classes

    data class Lesson(
        var title: String,
        var locale: String,
        var week: Int,
        var day: Int,
        var begin: Int,
        var end: Int
    )

    data class Exam(
        var title: String,
        var locale: String,
        var week: Int,
        var day: Int,
        var begin: Time,
        var end: Time
    )

    data class Session(
        val type: LessonType,
        val title: String,
        var locale: String,
        val week: Int,
        val dayOfWeek: Int,
        val begin: Int,
        val end: Int
    ) {
        constructor(type: LessonType, lesson: Lesson) :
                this(type, lesson.title, lesson.locale, lesson.week, lesson.day, lesson.begin, lesson.end)

        override fun equals(other: Any?): Boolean {
            val tryCast = other as? Session
            return tryCast != null && type == tryCast.type && title == tryCast.title &&
                    week == tryCast.week && dayOfWeek == tryCast.dayOfWeek &&
                    begin == tryCast.begin && end == tryCast.end
        }

        override fun hashCode(): Int {
            var result = type.hashCode()
            result = 31 * result + title.hashCode()
            result = 31 * result + week
            result = 31 * result + dayOfWeek
            result = 31 * result + begin
            result = 31 * result + end
            return result
        }
    }

    data class HiddenRule(
        val level: Int, // PRIMARY: 0, SECONDARY: 1
        val title: String,
        val week: Int, // ALL: -1, REPEAT: 0, ONCE: the week to be hidden
        val day: Int,
        val begin: Int,
        val end: Int
    ) {
        constructor(choice: Choice, session: Session) :
                this(
                    session.type.ordinal, session.title, when (choice) {
                        Choice.ONCE -> session.week
                        Choice.REPEAT -> 0
                        Choice.ALL -> -1
                    }, session.dayOfWeek, session.begin, session.end
                )
    }

    enum class Choice { ONCE, REPEAT, ALL }

    enum class LessonType {
        PRIMARY, SECONDARY, CUSTOM;

        override fun toString() = when (this) {
            PRIMARY -> "一级"
            SECONDARY -> "二级"
            CUSTOM -> "自定义"
        }
    }

    // In-memory data

    private var primaryList = mutableListOf<Lesson>()

    private var secondaryList = mutableListOf<Lesson>()

    private val customList = mutableListOf<Lesson>()

    private var examList = mutableListOf<Exam>()

    private val shortenMap = mutableMapOf<String, String>()

    private val colorMap = mutableMapOf<String, Int>()

    private val hiddenList = mutableListOf<HiddenRule>()

    // Public methods

    val lessonNames get() = (primaryList + secondaryList).map { it.title }.toMutableSet().toList()

    val taggedLessonList
        get() = primaryList.map { Session(LessonType.PRIMARY, it) }.filterNot { matchHiddenRule(it) } +
                secondaryList.map { Session(LessonType.SECONDARY, it) }.filterNot { matchHiddenRule(it) } +
                customList.map { Session(LessonType.CUSTOM, it) }

    val hiddenRules get() = hiddenList

    fun removeHiddenRule(hiddenRule: HiddenRule, callback: ((Int) -> Unit)? = null) {
        val sequence = hiddenRules.indices.reversed()
        for (i in sequence) {
            if (hiddenRules[i] == hiddenRule) {
                hiddenList.removeAt(i)
                callback?.invoke(i)
            }
        }
        safeThread {
            writableDatabase.delete(
                "hiddenList",
                "j_level = ? AND j_title = ? AND j_week = ? AND j_day = ? AND j_begin = ? AND j_end = ?",
                with(hiddenRule) {
                    arrayOf(
                        level.toString(),
                        title,
                        week.toString(),
                        day.toString(),
                        begin.toString(),
                        end.toString()
                    )
                }
            )
        }
    }

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

    fun delOrHide(choice: Choice, session: Session) {
        when (session.type) {
            LessonType.CUSTOM -> if (choice == Choice.ALL) {
                customList.removeAll { it.title == session.title }
                safeThread { writableDatabase.delete("customList", "j_title = ?", arrayOf(session.title)) }
            } else {
                customList.removeAll {
                    it.title == session.title && it.begin == session.begin && it.end == session.end &&
                            it.day == session.dayOfWeek && (choice == Choice.REPEAT || it.week == session.week)
                }
                safeThread {
                    if (choice == Choice.REPEAT)
                        writableDatabase.delete(
                            "customList",
                            "j_title = ? AND j_begin = ? AND j_end = ? AND j_day = ?",
                            arrayOf(
                                session.title,
                                session.begin.toString(),
                                session.end.toString(),
                                session.dayOfWeek.toString()
                            )
                        )
                    else
                        writableDatabase.delete(
                            "customList",
                            "j_title = ? AND j_begin = ? AND j_end = ? AND j_day = ? AND j_week = ?",
                            arrayOf(
                                session.title,
                                session.begin.toString(),
                                session.end.toString(),
                                session.dayOfWeek.toString(),
                                session.week.toString()
                            )
                        )
                }
            }
            else -> {
                with(HiddenRule(choice, session)) {
                    hiddenList.add(this)
                    safeThread { addItem(this, "hiddenList") }
                }
            }
        }
    }

    init {
        load()
    }

    fun refresh(primary: String, secondary: List<Lesson>?) {
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
                        val dateString = o["nq"] as String
                        val date = SchoolCalendar(
                            dateString.substring(0, 4).toInt(),
                            dateString.substring(5, 7).toInt(),
                            dateString.substring(8, 10).toInt()
                        )
                        val begin = parseBegin(o["kssj"] as String)
                        val end = parseEnd(o["jssj"] as String)
                        if (primaryLessonList.isNotEmpty() &&
                            title == primaryLessonList.last().title &&
                            locale == primaryLessonList.last().locale &&
                            date.weekNumber == primaryLessonList.last().week &&
                            date.dayOfWeek == primaryLessonList.last().day &&
                            begin <= primaryLessonList.last().end + 1
                        ) primaryLessonList.last().end = end
                        else primaryLessonList.add(Lesson(title, locale, date.weekNumber, date.dayOfWeek, begin, end))
                        shortenTitle(title, segmenter)
                    }
                    "考试" -> {
                        val dateString = o["nq"] as String
                        val date = SchoolCalendar(
                            dateString.substring(0, 4).toInt(),
                            dateString.substring(5, 7).toInt(),
                            dateString.substring(8, 10).toInt()
                        )
                        examList.add(
                            Exam(
                                (o["nr"] as String),
                                o["dd"] as? String ?: "",
                                date.weekNumber,
                                date.dayOfWeek,
                                Time.valueOf(o["kssj"] as String + ":00"),
                                Time.valueOf(o["jssj"] as String + ":00")
                            )
                        )
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        primaryList = primaryLessonList
        secondary?.run {
            forEach { shortenTitle(it.title, segmenter) }
            secondaryList = toMutableList()
        }
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

    private fun matchHiddenRule(session: Session) = hiddenList.any {
        (it.level == 0 && session.type == LessonType.PRIMARY || it.level == 1 && session.type == LessonType.SECONDARY) &&
                it.title == session.title && (it.week == -1 ||
                (it.day == session.dayOfWeek && it.begin == session.begin && it.end == session.end &&
                        (it.week == 0 || it.week == session.week)))
    }

    // Singleton initialization

    companion object {
        private const val dbVersion = 2

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

    private inner class ScheduleDBHelper(context: Context) :
        SQLiteOpenHelper(context, "calender.${loggedInUser.userId}.db", null, dbVersion) {
        private fun createTables(db: SQLiteDatabase, version: Int) {
            when (version) {
                1 -> {
                    db.execSQL("create table lesson(title String, locale String, date Long, beginning Integer, ending Integer)")
                    db.execSQL("create table exam(title String, locale String, date Long, beginning Long, ending Long)")
                    db.execSQL("create table auto(origin String, dest String)")
                    db.execSQL("create table custom(origin String, dest String)")
                    db.execSQL("create table color(name String, id Integer)")
                }
                2 -> {
                    db.execSQL("create table primaryList(j_title String, j_locale String, j_week Integer, j_day Integer, j_begin Integer, j_end Integer)")
                    db.execSQL("create table secondaryList(j_title String, j_locale String, j_week Integer, j_day Integer, j_begin Integer, j_end Integer)")
                    db.execSQL("create table customList(j_title String, j_locale String, j_week Integer, j_day Integer, j_begin Integer, j_end Integer)")
                    db.execSQL("create table examList(j_title String, j_locale String, j_week Integer, j_day Integer, j_begin Long, j_end Long)")
                    db.execSQL("create table shortenMap(j_first String, j_second String)")
                    db.execSQL("create table colorMap(j_first String, j_second Integer)")
                    db.execSQL("create table hiddenList(j_level Integer, j_title String, j_week Integer, j_day Integer, j_begin Integer, j_end Integer)")
                }
            }
        }

        override fun onCreate(db: SQLiteDatabase) {
            createTables(db, dbVersion)
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
            if (oldVersion <= 1 && newVersion >= 2) {
                Log.i("DB Update", "Schedule from $oldVersion to $newVersion")
                createTables(db, newVersion)
                db.query("lesson", null, null, null, null, null, null, null).apply {
                    while (moveToNext()) {
                        with(SchoolCalendar(getLong(2))) {
                            db.insert("primaryList", null, ContentValues().apply {
                                put("j_title", getString(0))
                                put("j_locale", getString(1))
                                put("j_week", weekNumber)
                                put("j_day", dayOfWeek)
                                put("j_begin", getInt(3))
                                put("j_end", getInt(4))
                            })
                        }
                    }
                    close()
                }
                db.query("exam", null, null, null, null, null, null, null).apply {
                    while (moveToNext())
                        with(SchoolCalendar(getLong(2))) {
                            db.insert("examList", null, ContentValues().apply {
                                put("j_title", getString(0))
                                put("j_locale", getString(1))
                                put("j_week", weekNumber)
                                put("j_day", dayOfWeek)
                                put("j_begin", getLong(3))
                                put("j_end", getLong(4))
                            })
                        }
                    close()
                }
                db.query("custom", null, null, null, null, null, null, null).apply {
                    while (moveToNext())
                        db.insert("shortenMap", null, ContentValues().apply {
                            put("j_first", getString(0))
                            put("j_second", getString(1))
                        })
                    close()
                }
                db.query("color", null, null, null, null, null, null, null).apply {
                    while (moveToNext())
                        db.insert("colorMap", null, ContentValues().apply {
                            put("j_first", getString(0))
                            put("j_second", getInt(1))
                        })
                    close()
                }
                db.execSQL("delete from lesson")
                db.execSQL("delete from exam")
                db.execSQL("delete from auto")
                db.execSQL("delete from custom")
                db.execSQL("delete from color")
                load()
            }
        }
    }
}