package com.unidy2002.thuinfo.data.lib

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class NewsDBHelper(context: Context?, version: Int) :
    SQLiteOpenHelper(context, "news.db", null, version) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            "create table news (\n" +
                    "title String,\n" +
                    "url String,\n" +
                    "brief String)"
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}
}