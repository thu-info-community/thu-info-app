package com.unidy2002.thuinfo.widget

import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.unidy2002.thuinfo.R

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
        val missing = snapshot == null || snapshot.empty
        val day = snapshot?.today
        val sc = WidgetStrings.context(context, snapshot)
        if (missing || day == null) {
            rv.setTextViewText(R.id.widget_today_empty, sc.getString(R.string.widget_empty_hint))
            rv.setViewVisibility(R.id.widget_today_empty, View.VISIBLE)
            rv.setViewVisibility(R.id.widget_today_header, View.GONE)
            rv.setViewVisibility(R.id.widget_today_rows, View.GONE)
            return rv
        }
        if (day.items.isEmpty()) {
            rv.setTextViewText(
                R.id.widget_today_empty,
                sc.getString(R.string.widget_empty_none_today),
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
        val capacity = TodayWindowing.capacity(detailed)
        val now = System.currentTimeMillis()
        val rowsLayout = if (detailed) {
            R.layout.widget_today_row_detailed
        } else {
            R.layout.widget_today_row_compact
        }
        for (item in TodayWindowing.visibleItems(day.items, capacity, now)) {
            rv.addView(R.id.widget_today_rows, renderRow(context, rowsLayout, detailed, item, now))
        }
        return rv
    }

    private fun renderRow(
        context: Context,
        rowsLayout: Int,
        detailed: Boolean,
        item: WidgetItem,
        now: Long,
    ): RemoteViews {
        val row = newRemoteViews(context, rowsLayout)
        if (detailed) {
            row.setTextViewText(R.id.widget_detail_name, item.name)
            if (item.loc.isEmpty()) {
                row.setViewVisibility(R.id.widget_detail_loc, View.GONE)
            } else {
                row.setTextViewText(R.id.widget_detail_loc, item.loc)
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
            row.setTextViewText(R.id.widget_compact_loc, item.loc.ifEmpty { "—" })
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
            if (TodayWindowing.ongoing(item, now)) {
                if (detailed) R.drawable.widget_detailed_row_bg else R.drawable.widget_compact_row_bg
            } else {
                0
            },
        )
        return row
    }
}
