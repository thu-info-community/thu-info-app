package com.unidy2002.thuinfo.data.dao

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.unidy2002.thuinfo.data.model.login.loggedInUser

class ReportIgnoreDB private constructor(val context: Context) {

    private val db = ReportIgnoreDBHelper().writableDatabase

    fun addIgnoreP(id: String) {
        ignorePSet.add(id)
        db.delete("ignoreP", "id = ?", arrayOf(id))
        db.insert("ignoreP", null, ContentValues().apply { put("id", id) })
    }

    fun removeIgnoreP(id: String) {
        ignorePSet.remove(id)
        db.delete("ignoreP", "id = ?", arrayOf(id))
    }

    fun hasIgnoreP(id: String) = ignorePSet.contains(id)

    private val ignorePSet = mutableSetOf<String>()

    init {
        db.query("ignoreP", null, null, null, null, null, null, null).apply {
            while (moveToNext()) ignorePSet.add(getString(0))
            close()
        }
    }

    fun close() {
        db.close()
    }

    companion object {
        private const val dbVersion = 1

        fun init(context: Context) {
            if (!loggedInUser.reportIgnoreInitialized()) {
                synchronized(ReportIgnoreDB::class.java) {
                    if (!loggedInUser.reportIgnoreInitialized()) {
                        loggedInUser.reportIgnore = ReportIgnoreDB(context)
                    }
                }
            }
        }
    }

    private inner class ReportIgnoreDBHelper :
        SQLiteOpenHelper(context, "reportIgnore.${loggedInUser.userId}.db", null, dbVersion) {
        override fun onCreate(db: SQLiteDatabase) {
            db.execSQL("create table ignoreP(id String)")
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}
    }
}