package com.unidy2002.thuinfo.data.dao

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import com.unidy2002.thuinfo.data.model.schedule.Schedule.Exam
import com.unidy2002.thuinfo.data.model.schedule.Schedule.Lesson
import java.sql.Date
import java.sql.Time

class ScheduleDBManager private constructor(context: Context?) {
    private val writableDatabase: SQLiteDatabase = ScheduleDBHelper(context, 1).writableDatabase

    private fun clearTable(tableName: String) {
        writableDatabase.execSQL("DELETE FROM $tableName")
    }

    fun updateLesson(lessonList: List<Lesson>) {
        clearTable("lesson")
        lessonList.forEach { addLesson(it) }
    }

    private fun addLesson(lesson: Lesson) {
        writableDatabase.insert("lesson", null, ContentValues().apply {
            put("title", lesson.title)
            put("abbr", "")
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
            put("abbr", "")
            put("locale", exam.locale)
            put("date", exam.date.time)
            put("beginning", exam.begin.time)
            put("ending", exam.end.time)
        })
    }

    fun updateAuto(autoShortenMap: Map<String, Pair<Boolean, String>>) {
        clearTable("auto")
        autoShortenMap.forEach { addAuto(it.key, it.value.first, it.value.second) }
    }

    private fun addAuto(origin: String?, avail: Boolean?, dest: String?) {
        writableDatabase.insert("auto", null, ContentValues().apply {
            put("origin", origin)
            put("avail", avail)
            put("dest", dest)
        })
    }

    fun updateCustom(customShortenMap: Map<String, String>) {
        clearTable("custom")
        customShortenMap.forEach { addCustom(it.key, it.value) }
    }

    private fun addCustom(origin: String?, dest: String?) {
        writableDatabase.insert("custom", null, ContentValues().apply {
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

    val lessonList: MutableList<Lesson>
        get() {
            val list: MutableList<Lesson> = ArrayList()
            val cursor = writableDatabase.query("lesson", null, null, null, null, null, null, null)
            while (cursor.moveToNext()) {
                val title = cursor.getString(0)
                val locale = cursor.getString(2)
                val date = Date(cursor.getLong(3))
                val begin = cursor.getInt(4)
                val end = cursor.getInt(5)
                list.add(Lesson(title, locale, date, begin, end))
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
                val locale = cursor.getString(2)
                val date = Date(cursor.getLong(3))
                val begin = Time(cursor.getLong(4))
                val end = Time(cursor.getLong(5))
                list.add(Exam(title, locale, date, begin, end))
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
        fun getInstance(context: Context?): ScheduleDBManager {
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