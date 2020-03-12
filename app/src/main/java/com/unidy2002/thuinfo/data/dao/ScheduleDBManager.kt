package com.unidy2002.thuinfo.data.dao

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.model.schedule.Schedule.Exam
import com.unidy2002.thuinfo.data.model.schedule.Schedule.Lesson
import java.sql.Date
import java.sql.Time

// TODO: the db manager is full of duplicated code

class ScheduleDBManager private constructor(context: Context) {
    private val writableDatabase: SQLiteDatabase = ScheduleDBHelper(context, 1).writableDatabase

    private fun clearTable(tableName: String) {
        writableDatabase.execSQL("DELETE FROM $tableName")
    }

    fun updatePrimaryLesson(lessonList: List<Lesson>) {
        clearTable("primary_lesson")
        lessonList.forEach { addLesson(it, "primary_lesson") }
    }

    fun updateSecondaryLesson(lessonList: List<Lesson>) {
        clearTable("secondary_lesson")
        lessonList.forEach { addLesson(it, "secondary_lesson") }
    }

    fun updateCustomLesson(lessonList: List<Lesson>) {
        clearTable("custom_lesson")
        lessonList.forEach { addLesson(it, "custom_lesson") }
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

    fun updateExam(examList: List<Exam>) {
        clearTable("exam")
        examList.forEach { addExam(it) }
    }

    private fun addExam(exam: Exam) {
        writableDatabase.insert("exam", null, ContentValues().apply {
            put("title", exam.title)
            put("locale", exam.locale)
            put("date", exam.date.time)
            put("beginning", exam.begin.time)
            put("ending", exam.end.time)
        })
    }

    fun updateShorten(shortenMap: Map<String, String>) {
        clearTable("shorten")
        shortenMap.forEach { addShorten(it.key, it.value) }
    }

    private fun addShorten(origin: String?, dest: String?) {
        writableDatabase.insert("shorten", null, ContentValues().apply {
            put("origin", origin)
            put("dest", dest)
        })
    }

    fun updateColor(colorMap: Map<String, Int>) {
        clearTable("color")
        colorMap.forEach { addColor(it.key, it.value) }
    }

    private fun addColor(name: String?, id: Int?) {
        writableDatabase.insert("color", null, ContentValues().apply {
            put("name", name)
            put("id", id)
        })
    }

    private fun getLessonList(tableName: String) =
        mutableListOf<Lesson>().apply {
            writableDatabase.query(tableName, null, null, null, null, null, null, null).apply {
                while (moveToNext())
                    add(Lesson(getString(0), getString(1), Date(getLong(2)), getInt(3), getInt(4)))
                close()
            }
        }

    val primaryLessonList get() = getLessonList("primary_lesson")

    val secondaryLessonList get() = getLessonList("secondary_lesson")

    val customLessonList get() = getLessonList("custom_lesson")

    val examList
        get() = mutableListOf<Exam>().apply {
            writableDatabase.query("exam", null, null, null, null, null, null, null).apply {
                while (moveToNext())
                    add(Exam(getString(0), getString(1), Date(getLong(2)), Time(getLong(3)), Time(getLong(4))))
                close()
            }
        }

    val shortenMap
        get() = mutableMapOf<String, String>().apply {
            writableDatabase.query("shorten", null, null, null, null, null, null, null).apply {
                while (moveToNext()) put(getString(0), getString(1))
                close()
            }
        }

    val colorMap
        get() = mutableMapOf<String, Int>().apply {
            writableDatabase.query("color", null, null, null, null, null, null, null).apply {
                while (moveToNext()) put(getString(0), getInt(1))
                close()
            }
        }

    companion object {
        fun init(context: Context) {
            if (loggedInUser.scheduleDBManager == null) {
                synchronized(ScheduleDBManager::class.java) {
                    if (loggedInUser.scheduleDBManager == null) {
                        loggedInUser.scheduleDBManager = ScheduleDBManager(context)
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