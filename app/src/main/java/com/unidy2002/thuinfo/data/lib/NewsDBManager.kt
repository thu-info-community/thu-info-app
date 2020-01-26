package com.unidy2002.thuinfo.data.lib

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase

class NewsDBManager private constructor(context: Context) {
    private val writableDatabase: SQLiteDatabase = NewsDBHelper(context, 1).writableDatabase

    fun add(title: String, url: String, brief: String) {
        writableDatabase.insert(
            "news",
            null,
            ContentValues().apply {
                put("title", title)
                put("url", url)
                put("brief", brief)
            }
        )
    }

    fun get(title: String, url: String): String? {
        val result: String?
        writableDatabase.rawQuery("SELECT brief FROM news WHERE title = ? AND url = ?", arrayOf(title, url)).apply {
            result =
                if (count > 0) {
                    moveToLast()
                    getString(0)
                } else {
                    null
                }
            close()
        }
        return result
    }

    companion object {
        private var instance: NewsDBManager? = null
        fun getInstance(context: Context): NewsDBManager {
            if (instance == null) {
                synchronized(NewsDBManager::class.java) {
                    if (instance == null) {
                        instance = NewsDBManager(context)
                    }
                }
            }
            return instance!!
        }
    }
}