package com.unidy2002.thuinfo.widget

import android.content.Context
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import com.unidy2002.thuinfo.R

// 1:1 port of harmony/entry/src/main/ets/widget/pages/NextCard.ets (1*2 strip /
// 2*2 tile). The next item is picked with the wall clock so it advances between
// provider pushes.
object NextCardRenderer {
    fun render(context: Context, size: WidgetSize, snapshot: WidgetSnapshot?): RemoteViews {
        val strip = size.heightDp < WidgetVariants.NEXT_STRIP_MAX_HEIGHT_DP
        return if (strip) renderStrip(context, size, snapshot) else renderTile(context, snapshot)
    }

    // 1*2: course details on the left and the time range on the right. The
    // strip is height-locked to one row, so its type scales with the measured
    // width instead: two grid columns keep the compact sizes, three or more
    // get the larger ones that fill the wide bar.
    private fun renderStrip(
        context: Context,
        size: WidgetSize,
        snapshot: WidgetSnapshot?,
    ): RemoteViews {
        val rv = newRemoteViews(context, R.layout.widget_next_strip)
        val sc = WidgetStrings.context(context, snapshot)
        val missing = snapshot == null || snapshot.empty
        val pick = snapshot?.let { WidgetSnapshotParser.pickNext(it, System.currentTimeMillis()) }
        if (missing || pick == null) {
            rv.setTextViewText(
                R.id.widget_next_empty,
                sc.getString(
                    if (missing) R.string.widget_empty_hint else R.string.widget_empty_none_soon,
                ),
            )
            rv.setViewVisibility(R.id.widget_next_empty, View.VISIBLE)
            rv.setViewVisibility(R.id.widget_next_strip_row, View.GONE)
            return rv
        }
        val item = pick.item
        val wide = size.widthDp >= 240f
        rv.setTextViewTextSize(
            R.id.widget_next_name,
            TypedValue.COMPLEX_UNIT_SP,
            if (wide) 20f else 14f,
        )
        rv.setTextViewTextSize(
            R.id.widget_next_loc,
            TypedValue.COMPLEX_UNIT_SP,
            if (wide) 14f else 11f,
        )
        rv.setTextViewTextSize(
            R.id.widget_next_from,
            TypedValue.COMPLEX_UNIT_SP,
            if (wide) 20f else 14f,
        )
        rv.setTextViewTextSize(
            R.id.widget_next_to,
            TypedValue.COMPLEX_UNIT_SP,
            if (wide) 14f else 11f,
        )
        rv.setTextViewText(R.id.widget_next_name, item.name)
        rv.setTextViewText(R.id.widget_next_loc, item.loc)
        rv.setTextViewText(R.id.widget_next_from, item.from)
        rv.setTextViewText(R.id.widget_next_to, item.to)
        rv.setViewVisibility(R.id.widget_next_empty, View.GONE)
        rv.setViewVisibility(R.id.widget_next_strip_row, View.VISIBLE)
        // Non-today items are dimmed to 55% opacity (NextCard.ets isToday()).
        if (pick.day.date != snapshot.today.date) {
            rv.setFloat(R.id.widget_next_strip_row, "setAlpha", 0.55f)
        }
        return rv
    }

    // 2*2: week/day in the header, course and location in the middle, time at
    // the bottom.
    private fun renderTile(context: Context, snapshot: WidgetSnapshot?): RemoteViews {
        val rv = newRemoteViews(context, R.layout.widget_next_tile)
        val sc = WidgetStrings.context(context, snapshot)
        val missing = snapshot == null || snapshot.empty
        val pick = snapshot?.let { WidgetSnapshotParser.pickNext(it, System.currentTimeMillis()) }
        if (missing || pick == null) {
            rv.setTextViewText(
                R.id.widget_next_empty,
                sc.getString(
                    if (missing) R.string.widget_empty_hint else R.string.widget_empty_none_soon,
                ),
            )
            rv.setViewVisibility(R.id.widget_next_empty, View.VISIBLE)
            rv.setViewVisibility(R.id.widget_next_header_row, View.GONE)
            rv.setViewVisibility(R.id.widget_next_mid, View.GONE)
            rv.setViewVisibility(R.id.widget_next_bottom, View.GONE)
            return rv
        }
        val item = pick.item
        // NextCard.ets itemWeek(): the week rolls over when the item's weekday
        // is before today's. Uses the unclamped snapshot.week.
        val itemWeek = if (pick.day.dayOfWeek < snapshot.today.dayOfWeek) {
            snapshot.week + 1
        } else {
            snapshot.week
        }
        rv.setTextViewText(
            R.id.widget_next_header,
            sc.getString(R.string.widget_next_header),
        )
        rv.setTextViewText(
            R.id.widget_next_week_label,
            sc.getString(R.string.widget_week_day_label, itemWeek, pick.day.label),
        )
        rv.setTextViewText(R.id.widget_next_name, item.name)
        if (item.loc.isEmpty()) {
            rv.setViewVisibility(R.id.widget_next_loc, View.GONE)
        } else {
            rv.setTextViewText(R.id.widget_next_loc, item.loc)
            rv.setViewVisibility(R.id.widget_next_loc, View.VISIBLE)
        }
        rv.setTextViewText(R.id.widget_next_time, "${item.from} – ${item.to}")
        rv.setViewVisibility(R.id.widget_next_empty, View.GONE)
        rv.setViewVisibility(R.id.widget_next_header_row, View.VISIBLE)
        rv.setViewVisibility(R.id.widget_next_mid, View.VISIBLE)
        rv.setViewVisibility(R.id.widget_next_bottom, View.VISIBLE)
        return rv
    }
}
