package com.unidy2002.thuinfo.data.dao

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import com.unidy2002.thuinfo.data.model.schedule.PersonalCalendar.Exam
import com.unidy2002.thuinfo.data.model.schedule.PersonalCalendar.Lesson
import java.sql.Date
import java.sql.Time
import java.util.*

class ScheduleDBManager private constructor(context: Context) {
    private val writableDatabase: SQLiteDatabase = ScheduleDBHelper(context, 1).writableDatabase

    fun addLesson(lesson: Lesson) {
        val contentValues = ContentValues()
        contentValues.put("title", lesson.title)
        contentValues.put("abbr", lesson.abbr)
        contentValues.put("locale", lesson.locale)
        contentValues.put("date", lesson.date.time)
        contentValues.put("beginning", lesson.begin)
        contentValues.put("ending", lesson.end)
        writableDatabase.insert("lesson", null, contentValues)
    }

    fun addExam(exam: Exam) {
        val contentValues = ContentValues()
        contentValues.put("title", exam.title)
        contentValues.put("abbr", exam.abbr)
        contentValues.put("locale", exam.locale)
        contentValues.put("date", exam.date.time)
        contentValues.put("beginning", exam.begin.time)
        contentValues.put("ending", exam.end.time)
        writableDatabase.insert("exam", null, contentValues)
    }

    fun addAuto(origin: String?, avail: Boolean?, dest: String?) {
        val contentValues = ContentValues()
        contentValues.put("origin", origin)
        contentValues.put("avail", avail)
        contentValues.put("dest", dest)
        writableDatabase.insert("auto", null, contentValues)
    }

    fun addCustom(origin: String?, dest: String?) {
        val contentValues = ContentValues()
        contentValues.put("origin", origin)
        contentValues.put("dest", dest)
        writableDatabase.insert("custom", null, contentValues)
    }

    fun addColor(name: String?, id: Int?) {
        val contentValues = ContentValues()
        contentValues.put("name", name)
        contentValues.put("id", id)
        writableDatabase.insert("color", null, contentValues)
    }

    val lessonList: MutableList<Lesson>
        get() {
            val list: MutableList<Lesson> = ArrayList()
            val cursor = writableDatabase.query("lesson", null, null, null, null, null, null, null)
            while (cursor.moveToNext()) {
                val title = cursor.getString(0)
                val abbr = cursor.getString(1)
                val locale = cursor.getString(2)
                val date = Date(cursor.getLong(3))
                val begin = cursor.getInt(4)
                val end = cursor.getInt(5)
                list.add(Lesson(title, abbr, locale, date, begin, end))
            }
            cursor.close()
            return list
        }

    val examList: MutableList<Exam>
        get() {
            val list: MutableList<Exam> = ArrayList()
            val cursor = writableDatabase.query("exam", null, null, null, null, null, null, null)
            while (cursor.moveToNext()) {
                val title = cursor.getString(0)
                val abbr = cursor.getString(1)
                val locale = cursor.getString(2)
                val date = Date(cursor.getLong(3))
                val begin = Time(cursor.getLong(4))
                val end = Time(cursor.getLong(5))
                list.add(Exam(title, abbr, locale, date, begin, end))
            }
            cursor.close()
            return list
        }

    val autoShortenMap: MutableMap<String, Pair<Boolean, String>>
        get() {
            val map: MutableMap<String, Pair<Boolean, String>> =
                LinkedHashMap()
            val cursor = writableDatabase.query("auto", null, null, null, null, null, null, null)
            while (cursor.moveToNext()) {
                map[cursor.getString(0)] = Pair(cursor.getInt(1) == 1, cursor.getString(2))
            }
            cursor.close()
            return map
        }

    val customShortenMap: MutableMap<String, String>
        get() {
            val map: MutableMap<String, String> =
                LinkedHashMap()
            val cursor = writableDatabase.query("custom", null, null, null, null, null, null, null)
            while (cursor.moveToNext()) {
                map[cursor.getString(0)] = cursor.getString(1)
            }
            cursor.close()
            return map
        }

    val colorMap: MutableMap<String, Int>
        get() {
            val map: MutableMap<String, Int> = LinkedHashMap()
            val cursor = writableDatabase.query("color", null, null, null, null, null, null, null)
            while (cursor.moveToNext()) {
                map[cursor.getString(0)] = cursor.getInt(1)
            }
            cursor.close()
            return map
        }

    companion object {
        private var instance: ScheduleDBManager? = null
        fun getInstance(context: Context): ScheduleDBManager {
            if (instance == null) {
                synchronized(ScheduleDBManager::class.java) {
                    if (instance == null) {
                        instance = ScheduleDBManager(context)
                    }
                }
            }
            return instance!!
        }
    }
}