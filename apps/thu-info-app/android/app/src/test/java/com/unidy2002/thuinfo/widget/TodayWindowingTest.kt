package com.unidy2002.thuinfo.widget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// TodayCard.ets windowing math: the window always contains the ongoing item,
// or the next item when nothing is ongoing.
class TodayWindowingTest {

    private fun item(begin: Long, end: Long) = WidgetItem(
        name = "Course",
        loc = "",
        from = "",
        to = "",
        begin = begin,
        end = end,
        color = "00a6f2",
    )

    // One-hour items starting at 8:00, 10:00, ... on an arbitrary epoch day.
    private fun items(count: Int): List<WidgetItem> =
        (0 until count).map { item(it * 2L * 3600_000L, it * 2L * 3600_000L + 3600_000L) }

    @Test
    fun `capacity is 4 compact and 5 detailed`() {
        assertEquals(4, TodayWindowing.capacity(detailed = false))
        assertEquals(5, TodayWindowing.capacity(detailed = true))
    }

    @Test
    fun `focus is the ongoing item`() {
        val now = 4L * 3600_000L + 1_800_000L // inside item 2 (4h..5h)
        assertEquals(2, TodayWindowing.automaticFocusIndex(items(8), now))
    }

    @Test
    fun `focus is the first future item when nothing is ongoing`() {
        val now = 1L * 3600_000L + 1 // item 0 already ended, item 1 not started
        assertEquals(1, TodayWindowing.automaticFocusIndex(items(8), now))
    }

    @Test
    fun `focus is the last item when everything has ended`() {
        val now = 100L * 3600_000L
        assertEquals(7, TodayWindowing.automaticFocusIndex(items(8), now))
    }

    @Test
    fun `focus is -1 for an empty list`() {
        assertEquals(-1, TodayWindowing.automaticFocusIndex(emptyList(), 0))
    }

    @Test
    fun `window keeps the focus roughly centered and clamps to bounds`() {
        // 8 items, capacity 4 -> max start 4; focus 5 centers at start 4.
        assertEquals(4, TodayWindowing.windowStart(8, 4, 5))
        // Focus 0 cannot go negative.
        assertEquals(0, TodayWindowing.windowStart(8, 4, 0))
        // Focus near the end clamps to the maximum start.
        assertEquals(4, TodayWindowing.windowStart(8, 4, 7))
    }

    @Test
    fun `window is zero when everything fits`() {
        assertEquals(0, TodayWindowing.windowStart(4, 4, 3))
        assertEquals(0, TodayWindowing.windowStart(3, 5, 2))
    }

    @Test
    fun `visible items contain the ongoing item and stay within capacity`() {
        val all = items(8)
        val now = 4L * 3600_000L + 1_800_000L // inside item 2 (4h..5h)
        val visible = TodayWindowing.visibleItems(all, 4, now)
        assertEquals(4, visible.size)
        assertTrue(visible.contains(all[2])) // the ongoing item
        assertEquals(1, all.indexOf(visible.first())) // focus 2 centered -> start 1
    }

    @Test
    fun `visible items returns everything when it fits`() {
        val all = items(3)
        assertEquals(all, TodayWindowing.visibleItems(all, 4, 0))
    }

    @Test
    fun `ongoing is begin inclusive and end exclusive`() {
        assertTrue(TodayWindowing.ongoing(item(10, 20), 10))
        assertTrue(TodayWindowing.ongoing(item(10, 20), 19))
        assertFalse(TodayWindowing.ongoing(item(10, 20), 20))
        assertFalse(TodayWindowing.ongoing(item(10, 20), 9))
    }
}
