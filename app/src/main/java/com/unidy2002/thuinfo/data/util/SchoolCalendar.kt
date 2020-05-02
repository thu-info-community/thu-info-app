package com.unidy2002.thuinfo.data.util

import java.text.SimpleDateFormat
import java.time.Month
import java.util.*
import kotlin.math.floor

// Currently only supports 2020-Spring
// In future versions it shall allow automatic update

class SchoolCalendar() : GregorianCalendar(Locale.CHINA) {

    val weekNumber get() = floor((timeInMillis - firstDay.time.time) / 604800000.0).toInt() + 1

    val dayOfWeek get() = get(Calendar.DAY_OF_WEEK).run { if (this > 1) this - 1 else 7 }

    constructor(milli: Long) : this() {
        with(SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).format(milli)) {
            clear()
            set(substring(0, 4).toInt(), substring(5, 7).toInt() - 1, substring(8, 10).toInt())
        }
    }

    constructor(year: Int, month: Int, day: Int) : this() {
        clear()
        set(year, month - 1, day) // Note: in GregorianCalendar, month value is 0-based.
    }

    constructor(week: Int, dayOfWeek: Int) : this() { // Day of week indexes from 1 (Monday)
        clear()
        set(firstDay.get(Calendar.YEAR), firstDay.get(Calendar.MONTH), firstDay.get(Calendar.DATE))
        add(Calendar.DATE, (week - 1) * 7 + dayOfWeek - 1)
    }

    companion object {
        val firstDay = GregorianCalendar(Locale.CHINA).also { it.clear(); it.set(2020, Month.FEBRUARY.ordinal, 17) }
        val weekCount = 18
        val semesterType = SemesterType.SPRING
        val semesterId = "2019-2020-2"
    }

    enum class SemesterType { SPRING, SUMMER, AUTUMN }

    override fun equals(other: Any?): Boolean {
        val tryCast = other as? SchoolCalendar
        return if (tryCast == null) {
            false
        } else {
            (tryCast.get(Calendar.DATE) == get(Calendar.DATE)
                    && tryCast.get(Calendar.MONTH) == get(Calendar.MONTH)
                    && tryCast.get(Calendar.YEAR) == get(Calendar.YEAR))
        }
    }

    override fun hashCode() = super.hashCode() + 233 // Only to silent Idea's warning
}