package com.unidy2002.thuinfo.data.util

import java.time.DayOfWeek
import java.time.Month
import java.util.*
import kotlin.math.floor

// Currently only supports 2020-Spring
// In future versions it shall allow automatic update

class SchoolCalendar() : GregorianCalendar(Locale.CHINA) {

    val weekNumber get() = floor((timeInMillis - firstDay.time.time) / 604800000.0).toInt() + 1

    val dayOfWeek get() = get(Calendar.DAY_OF_WEEK)

    override fun toString() = "第${weekNumber}周 ${weekInChinese[dayOfWeek]}"

    constructor(year: Int, month: Int, day: Int) : this() {
        set(year, month - 1, day) // Note: in GregorianCalendar, month value is 0-based.
    }

    constructor(week: Int, dayOfWeek: DayOfWeek) : this() {
        set(firstDay.get(Calendar.YEAR), firstDay.get(Calendar.MONTH), firstDay.get(Calendar.DATE))
        add(Calendar.DATE, (week - 1) * 7 + dayOfWeek.ordinal)
    }

    enum class SemesterType { SPRING, SUMMER, AUTUMN }

    private val weekInChinese = mapOf(
        Calendar.MONDAY to "周一",
        Calendar.TUESDAY to "周二",
        Calendar.WEDNESDAY to "周三",
        Calendar.THURSDAY to "周四",
        Calendar.FRIDAY to "周五",
        Calendar.SATURDAY to "周六",
        Calendar.SUNDAY to "周日"
    )

    companion object {
        val firstDay = GregorianCalendar(Locale.CHINA).also { it.set(2019, Month.SEPTEMBER.ordinal, 9) }
        val lastDay = GregorianCalendar(Locale.CHINA).also { it.set(2020, Month.JANUARY.ordinal, 12) }
        val weekCount = 18
        val semesterType = SemesterType.AUTUMN
    }
}