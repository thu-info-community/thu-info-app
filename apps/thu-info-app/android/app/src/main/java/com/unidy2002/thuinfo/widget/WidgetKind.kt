package com.unidy2002.thuinfo.widget

enum class WidgetKind {
    NEXT,
    TODAY,
    WEEK,
}

// HarmonyOS cards come in discrete launcher dimensions written rows*columns
// (height first): Next 1*2 | 2*2, Today 2*4 | 4*4, Week 4*4 | 6*4 — the
// WeekCard source proves the first number is the row count. Android launchers
// resize widgets continuously, so each variant is picked from the measured
// card height; the thresholds approximate the HarmonyOS row heights.
object WidgetVariants {
    // A HarmonyOS launcher row is ~110 dp and the strip card is a single row.
    const val NEXT_STRIP_MAX_HEIGHT_DP = 160
    // Compact rows (capacity 4) fit 2-3 launcher rows; detailed rows (capacity
    // 5) need 4+ — HarmonyOS shows them at 2*4 and 4*4 respectively.
    const val TODAY_DETAILED_MIN_HEIGHT_DP = 300
    // HarmonyOS shows the time axis only on 6*4 (six launcher rows tall).
    const val WEEK_AXIS_MIN_HEIGHT_DP = 500
}

// TodayCard.ets selection, kept free of Android imports so it is unit-testable.
data class FollowUpCourse(val day: WidgetDay, val item: WidgetItem)

object FollowUpCourses {
    fun capacity(detailed: Boolean): Int = if (detailed) 5 else 4

    fun currentDay(days: List<WidgetDay>, todayDate: String): WidgetDay? =
        days.firstOrNull { it.date == todayDate }

    fun visibleItems(
        days: List<WidgetDay>,
        todayDate: String,
        capacity: Int,
        now: Long,
    ): List<FollowUpCourse> {
        val todayIndex = days.indexOfFirst { it.date == todayDate }
        if (todayIndex < 0) return emptyList()

        val courses = days.drop(todayIndex).flatMap { day ->
            day.items.map { item -> FollowUpCourse(day, item) }
        }
        val nextIndex = courses.indexOfFirst { it.item.end > now }
        val start = when {
            nextIndex < 0 -> courses.indexOfLast { it.day.date == todayDate }
            courses[nextIndex].item.begin <= now -> nextIndex
            nextIndex > 0 && courses[nextIndex - 1].day.date == todayDate -> nextIndex - 1
            else -> nextIndex
        }
        return if (start < 0) emptyList() else courses.drop(start).take(capacity)
    }

    fun locationText(course: FollowUpCourse, todayDate: String): String {
        val location = course.item.loc
        if (course.day.date == todayDate) return location
        val date = course.day.date.replace('-', '/')
        return if (location.isEmpty()) date else "$date · $location"
    }

    // TodayCard.ets ongoing(): begin <= now < end.
    fun ongoing(item: WidgetItem, now: Long): Boolean = item.begin <= now && now < item.end
}
