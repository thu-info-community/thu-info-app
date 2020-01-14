package com.unidy2002.thuinfo.data.model

import java.util.Date
import java.util.Calendar


data class NewsCard(
    val originId: Int,
    val date: Date,
    val sender: String,
    val title: String,
    val brief: String,
    val href: String
) {
    fun getComparableDate(): Date =
        if (originId > 0)
            date
        else {
            val calendar = Calendar.getInstance()
            calendar.time = date
            calendar.add(Calendar.DAY_OF_MONTH, 3)
            calendar.time
        }
}