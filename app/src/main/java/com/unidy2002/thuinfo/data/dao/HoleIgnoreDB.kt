package com.unidy2002.thuinfo.data.dao

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.unidy2002.thuinfo.data.model.login.loggedInUser

class HoleIgnoreDB private constructor(val context: Context) {

    private val db = HoleIgnoreDBHelper().writableDatabase

    fun addIgnoreP(id: Int) {
        ignorePSet.add(id)
        db.insert("ignoreP", null, ContentValues().apply { put("id", id) })
    }

    fun hasIgnoreP(id: Int) = ignorePSet.contains(id)

    private val ignorePSet = mutableSetOf<Int>()

    init {
        db.query("ignoreP", null, null, null, null, null, null, null).apply {
            while (moveToNext()) ignorePSet.add(getInt(0))
            close()
        }
    }

    fun close() {
        db.close()
    }

    companion object {
        private const val dbVersion = 1

        fun init(context: Context) {
            println(1)
            if (!loggedInUser.holeIgnoreInitialized()) {
                println(2)
                synchronized(HoleIgnoreDB::class.java) {
                    println(3)
                    if (!loggedInUser.holeIgnoreInitialized()) {
                        println(4)
                        loggedInUser.holeIgnore = HoleIgnoreDB(context)
                    }
                }
            }
        }
    }

    private inner class HoleIgnoreDBHelper :
        SQLiteOpenHelper(context, "holeIgnore.${loggedInUser.userId}.db", null, dbVersion) {
        override fun onCreate(db: SQLiteDatabase) {
            db.execSQL("create table ignoreP(id Integer)")
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}
    }
}