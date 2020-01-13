package com.unidy2002.thuinfo.data.lib

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class DBHelper(context: Context?, version: Int) : SQLiteOpenHelper(context, db_name, null, version) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            "create table lesson (\n" +
                    "title String,\n" +
                    "abbr String,\n" +
                    "locale String,\n" +
                    "date Long,\n" +
                    "beginning Integer,\n" +
                    "ending Integer)"
        )
        db.execSQL(
            "create table exam (\n" +
                    "title String,\n" +
                    "abbr String,\n" +
                    "locale String,\n" +
                    "date Long,\n" +
                    "beginning Long,\n" +
                    "ending Long)"
        )
        db.execSQL(
            "create table auto (\n" +
                    "origin String,\n" +
                    "avail Boolean,\n" +
                    "dest String)"
        )
        db.execSQL(
            "create table custom (\n" +
                    "origin String,\n" +
                    "dest String)"
        )
        db.execSQL(
            "create table color (\n" +
                    "name String,\n" +
                    "id Integer)"
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}

    companion object {
        const val db_name = "calender.db"
    }
}