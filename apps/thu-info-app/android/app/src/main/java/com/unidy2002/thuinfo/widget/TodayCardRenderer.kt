package com.unidy2002.thuinfo.widget

import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.unidy2002.thuinfo.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// 1:1 port of harmony/entry/src/main/ets/widget/pages/TodayCard.ets (2*4
// compact / 4*4 detailed). Rows are RemoteViews added into a container whose
// XML divider provides the Column({space}) gaps.
object TodayCardRenderer {
    fun render(context: Context, size: WidgetSize, snapshot: WidgetSnapshot?): RemoteViews {
        val detailed = size.heightDp >= WidgetVariants.TODAY_DETAILED_MIN_HEIGHT_DP
        val rv = newRemoteViews(
            context,
            if (detailed) R.layout.widget_today_detailed else R.layout.widget_today_compact,
        )
        val now = System.currentTimeMillis()
        val todayDate = SimpleDateFormat("MM-dd", Locale.US).format(Date(now))
        val missing = snapshot == null || snapshot.empty
        val day = snapshot?.let { FollowUpCourses.currentDay(it.nextDays, todayDate) }
        val visible = snapshot?.let {
            FollowUpCourses.visibleItems(it.nextDays, todayDate, FollowUpCourses.capacity(detailed), now)
        } ?: emptyList()
        val sc = WidgetStrings.context(context, snapshot)
        if (missing || day == null || visible.isEmpty()) {
            rv.setTextViewText(
                R.id.widget_today_empty,
                sc.getString(
                    if (missing || day == null) R.string.widget_empty_hint
                    else R.string.widget_empty_none_followup,
                ),
            )
            rv.setViewVisibility(R.id.widget_today_empty, View.VISIBLE)
            rv.setViewVisibility(R.id.widget_today_header, View.GONE)
            rv.setViewVisibility(R.id.widget_today_rows, View.GONE)
            return rv
        }
        rv.setTextViewText(R.id.widget_today_title, sc.getString(R.string.widget_today_header))
        // The same date line as the home agenda section; older snapshots fall
        // back to the bare "date label" pair.
        rv.setTextViewText(R.id.widget_today_date, day.dateText.ifEmpty { "${day.date} ${day.label}" })
        rv.setViewVisibility(R.id.widget_today_empty, View.GONE)
        rv.setViewVisibility(R.id.widget_today_header, View.VISIBLE)
        rv.setViewVisibility(R.id.widget_today_rows, View.VISIBLE)
        rv.removeAllViews(R.id.widget_today_rows)
        for (course in visible) {
            rv.addView(R.id.widget_today_rows, renderRow(context, detailed, course, todayDate, now))
        }
        return rv
    }

    private fun renderRow(
        context: Context,
        detailed: Boolean,
        course: FollowUpCourse,
        todayDate: String,
        now: Long,
    ): RemoteViews {
        val item = course.item
        val location = FollowUpCourses.locationText(course, todayDate)
        val row = newRemoteViews(
            context,
            if (detailed) R.layout.widget_today_row_detailed else R.layout.widget_today_row_compact,
        )
        if (detailed) {
            row.setTextViewText(R.id.widget_detail_name, item.name)
            if (location.isEmpty()) {
                row.setViewVisibility(R.id.widget_detail_loc, View.GONE)
            } else {
                row.setTextViewText(R.id.widget_detail_loc, location)
                row.setViewVisibility(R.id.widget_detail_loc, View.VISIBLE)
            }
            row.setTextViewText(R.id.widget_detail_from, item.from)
            row.setTextViewText(R.id.widget_detail_to, item.to)
            row.setInt(
                R.id.widget_detail_bar,
                "setImageLevel",
                WidgetPalette.bar(item.color),
            )
        } else {
            row.setTextViewText(R.id.widget_compact_name, item.name)
            row.setTextViewText(R.id.widget_compact_loc, location.ifEmpty { "—" })
            row.setTextViewText(R.id.widget_compact_time, "${item.from}–${item.to}")
            row.setInt(
                R.id.widget_compact_bar,
                "setImageLevel",
                WidgetPalette.bar(item.color),
            )
        }
        // Ongoing rows are tinted (TodayCard.ets ongoing(): begin <= now < end).
        row.setInt(
            R.id.widget_row,
            "setBackgroundResource",
            if (FollowUpCourses.ongoing(item, now)) {
                if (detailed) R.drawable.widget_detailed_row_bg else R.drawable.widget_compact_row_bg
            } else {
                0
            },
        )
        return row
    }
}
