package com.unidy2002.thuinfo.widget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FollowUpCoursesTest {
    private fun item(begin: Long, end: Long, name: String = "$begin", loc: String = "") = WidgetItem(
        name = name,
        loc = loc,
        from = "",
        to = "",
        begin = begin,
        end = end,
        color = "00a6f2",
    )

    private fun day(date: String, vararg items: WidgetItem) = WidgetDay(
        dayOfWeek = 1,
        date = date,
        label = "",
        items = items.toList(),
    )

    private val todayDate = "09-23"

    @Test
    fun `compact and detailed cards keep readable capacities`() {
        assertEquals(4, FollowUpCourses.capacity(detailed = false))
        assertEquals(5, FollowUpCourses.capacity(detailed = true))
    }

    @Test
    fun `starts with the ongoing course`() {
        val today = day(todayDate, item(0, 10), item(20, 30), item(40, 50))
        val visible = FollowUpCourses.visibleItems(listOf(today), todayDate, 4, 25)
        assertEquals(listOf(today.items[1], today.items[2]), visible.map { it.item })
    }

    @Test
    fun `starts with the last finished course between classes`() {
        val today = day(todayDate, item(0, 10), item(20, 30), item(40, 50))
        val visible = FollowUpCourses.visibleItems(listOf(today), todayDate, 4, 35)
        assertEquals(listOf(today.items[1], today.items[2]), visible.map { it.item })
    }

    @Test
    fun `before the first class starts with the next one and not yesterday`() {
        val yesterday = day("09-22", item(-20, -10))
        val today = day(todayDate, item(10, 20))
        val visible = FollowUpCourses.visibleItems(listOf(yesterday, today), todayDate, 4, 0)
        assertEquals(listOf(today.items[0]), visible.map { it.item })
    }

    @Test
    fun `fills remaining rows from following days after today's last course`() {
        val today = day(todayDate, item(0, 10), item(20, 30))
        val tomorrow = day("09-24", item(100, 110), item(120, 130))
        val later = day("09-25", item(200, 210), item(220, 230))
        val visible = FollowUpCourses.visibleItems(
            listOf(today, tomorrow, later), todayDate, 4, 35,
        )
        assertEquals(listOf(today.items[1], tomorrow.items[0], tomorrow.items[1], later.items[0]),
            visible.map { it.item })
        assertEquals(listOf(todayDate, "09-24", "09-24", "09-25"),
            visible.map { it.day.date })
    }

    @Test
    fun `a day without classes starts at the next available course`() {
        val emptyToday = day(todayDate)
        val emptyTomorrow = day("09-24")
        val later = day("09-25", item(200, 210))
        val visible = FollowUpCourses.visibleItems(
            listOf(emptyToday, emptyTomorrow, later), todayDate, 5, 35,
        )
        assertEquals(listOf(later.items[0]), visible.map { it.item })
    }

    @Test
    fun `without future courses keeps only today's last course`() {
        val today = day(todayDate, item(0, 10), item(20, 30))
        val visible = FollowUpCourses.visibleItems(listOf(today), todayDate, 4, 100)
        assertEquals(listOf(today.items[1]), visible.map { it.item })
    }

    @Test
    fun `stale snapshot outside the current date asks for sync`() {
        val days = listOf(day("09-21", item(0, 10)), day("09-22", item(20, 30)))
        assertEquals(null, FollowUpCourses.currentDay(days, todayDate))
        assertTrue(FollowUpCourses.visibleItems(days, todayDate, 4, 35).isEmpty())
    }

    @Test
    fun `today is found after midnight in a snapshot made yesterday`() {
        val yesterday = day("09-22", item(-20, -10))
        val today = day(todayDate, item(10, 20))
        val days = listOf(yesterday, today)
        assertEquals(today, FollowUpCourses.currentDay(days, todayDate))
        assertEquals(listOf(today.items[0]),
            FollowUpCourses.visibleItems(days, todayDate, 5, 0).map { it.item })
    }

    @Test
    fun `date appears in the location of later courses`() {
        val today = day(todayDate, item(0, 10, loc = "A"))
        val tomorrow = day("09-24", item(100, 110, loc = "B"), item(120, 130))
        assertEquals("A", FollowUpCourses.locationText(FollowUpCourse(today, today.items[0]), todayDate))
        assertEquals("09/24 · B", FollowUpCourses.locationText(
            FollowUpCourse(tomorrow, tomorrow.items[0]), todayDate,
        ))
        assertEquals("09/24", FollowUpCourses.locationText(
            FollowUpCourse(tomorrow, tomorrow.items[1]), todayDate,
        ))
    }

    @Test
    fun `ongoing ends at the exclusive end time`() {
        assertTrue(FollowUpCourses.ongoing(item(10, 20), 10))
        assertTrue(FollowUpCourses.ongoing(item(10, 20), 19))
        assertFalse(FollowUpCourses.ongoing(item(10, 20), 20))
        assertFalse(FollowUpCourses.ongoing(item(10, 20), 9))
    }
}
