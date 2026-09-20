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

// TodayCard.ets windowing, kept free of Android imports so it is unit-testable.
// Overflow is clipped to a window that always contains the ongoing item, or
// the next item when nothing is ongoing.
object TodayWindowing {
    fun capacity(detailed: Boolean): Int = if (detailed) 5 else 4

    fun automaticFocusIndex(items: List<WidgetItem>, now: Long): Int {
        if (items.isEmpty()) {
            return -1
        }
        for (i in items.indices) {
            if (items[i].begin <= now && now < items[i].end) {
                return i
            }
        }
        for (i in items.indices) {
            if (items[i].begin > now) {
                return i
            }
        }
        return items.size - 1
    }

    fun windowStart(itemCount: Int, capacity: Int, focusIndex: Int): Int {
        if (itemCount <= capacity) {
            return 0
        }
        val maximumStart = itemCount - capacity
        val itemsBeforeFocus = (capacity - 1) / 2
        val desiredStart = focusIndex - itemsBeforeFocus
        return maxOf(0, minOf(desiredStart, maximumStart))
    }

    fun visibleItems(items: List<WidgetItem>, capacity: Int, now: Long): List<WidgetItem> {
        if (items.size <= capacity) {
            return items
        }
        val start = windowStart(items.size, capacity, automaticFocusIndex(items, now))
        return items.subList(start, start + capacity)
    }

    // TodayCard.ets ongoing(): begin <= now < end.
    fun ongoing(item: WidgetItem, now: Long): Boolean = item.begin <= now && now < item.end
}
