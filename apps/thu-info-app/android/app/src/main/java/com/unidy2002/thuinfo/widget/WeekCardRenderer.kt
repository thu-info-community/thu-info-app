package com.unidy2002.thuinfo.widget

import android.content.Context
import android.os.Build
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import com.unidy2002.thuinfo.R

// 1:1 port of harmony/entry/src/main/ets/widget/pages/WeekCard.ets (4*4 / 6*4).
// The app serializes the same time layout used by the in-app schedule,
// normalized after trimming leading and trailing empty time.
//
// The precise grid needs setViewLayoutWidth/Height/Margin (API 31+); older
// devices render the same legacy flow layout WeekCard.ets keeps for old
// snapshots. HarmonyOS estimates the grid height from launcher row metrics
// (estimatedGridHeight()); here the measured card height is known exactly, so
// it is used for both positioning and the text-detail thresholds.
object WeekCardRenderer {
    // Chrome above the grid: header (14sp title line) and the day-headings row
    // (label + underline + date + 1dp gaps + 5/3dp margins). Scaled by fontScale.
    private const val HEADER_DP = 19f
    private const val HEADINGS_DP = 33f
    private const val CARD_PADDING_DP = 12f
    private const val AXIS_WIDTH_DP = 38f

    fun render(context: Context, size: WidgetSize, snapshot: WidgetSnapshot?): RemoteViews {
        val missing = snapshot == null || snapshot.empty
        val weekView = snapshot?.weekView
        return if (missing) {
            renderHintOnly(context, size, snapshot)
        } else if (weekView == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            renderLegacy(context, snapshot, weekView)
        } else {
            renderMirrored(context, size, snapshot, weekView)
        }
    }

    // snapshot === null || snapshot.empty -> the plain hint, nothing else.
    private fun renderHintOnly(
        context: Context,
        size: WidgetSize,
        snapshot: WidgetSnapshot?,
    ): RemoteViews {
        val rv = newRemoteViews(context, R.layout.widget_week_mirrored)
        rv.setTextViewText(
            R.id.widget_week_empty,
            WidgetStrings.context(context, snapshot).getString(R.string.widget_empty_hint),
        )
        rv.setViewVisibility(R.id.widget_week_empty, View.VISIBLE)
        rv.setViewVisibility(R.id.widget_week_header, View.GONE)
        rv.setViewVisibility(R.id.widget_week_headings, View.GONE)
        rv.setViewVisibility(R.id.widget_week_none, View.GONE)
        rv.setViewVisibility(R.id.widget_week_grid, View.GONE)
        return rv
    }

    private fun renderMirrored(
        context: Context,
        size: WidgetSize,
        snapshot: WidgetSnapshot,
        weekView: WidgetWeekView,
    ): RemoteViews {
        val showAxis = size.heightDp >= WidgetVariants.WEEK_AXIS_MIN_HEIGHT_DP
        val rv = newRemoteViews(context, R.layout.widget_week_mirrored)
        val sc = WidgetStrings.context(context, snapshot)
        rv.setTextViewText(
            R.id.widget_week_title,
            sc.getString(R.string.widget_week_header),
        )
        rv.setTextViewText(
            R.id.widget_week_label,
            sc.getString(R.string.widget_week_label, weekView.week),
        )
        rv.setViewVisibility(R.id.widget_week_empty, View.GONE)
        rv.setViewVisibility(R.id.widget_week_header, View.VISIBLE)
        rv.setViewVisibility(R.id.widget_week_headings, View.VISIBLE)
        rv.setViewVisibility(
            R.id.widget_week_axis_spacer,
            if (showAxis) View.VISIBLE else View.GONE,
        )
        rv.setViewVisibility(R.id.widget_week_axis, if (showAxis) View.VISIBLE else View.GONE)

        // Day headings: today's label is accent-colored with an accent underline.
        rv.removeAllViews(R.id.widget_week_headings_row)
        val axisAware = if (showAxis) 10f else 9f
        for (day in weekView.days) {
            val heading = newRemoteViews(
                context,
                if (isToday(snapshot, day)) {
                    R.layout.widget_week_day_heading_today
                } else {
                    R.layout.widget_week_day_heading
                },
            )
            heading.setTextViewText(R.id.widget_day_label, day.label)
            heading.setTextViewText(R.id.widget_day_date, day.date.replaceFirst("-", "/"))
            heading.setTextViewTextSize(
                R.id.widget_day_label,
                TypedValue.COMPLEX_UNIT_SP,
                axisAware,
            )
            heading.setTextViewTextSize(
                R.id.widget_day_date,
                TypedValue.COMPLEX_UNIT_SP,
                if (showAxis) 8f else 7f,
            )
            rv.addView(R.id.widget_week_headings_row, heading)
        }

        if (weekView.blocks.isEmpty()) {
            rv.setTextViewText(
                R.id.widget_week_none,
                sc.getString(R.string.widget_empty_none_week),
            )
            rv.setViewVisibility(R.id.widget_week_none, View.VISIBLE)
            rv.setViewVisibility(R.id.widget_week_grid, View.GONE)
            return rv
        }
        rv.setViewVisibility(R.id.widget_week_none, View.GONE)
        rv.setViewVisibility(R.id.widget_week_grid, View.VISIBLE)
        rv.removeAllViews(R.id.widget_week_grid_cells)
        if (showAxis) {
            rv.removeAllViews(R.id.widget_week_axis)
        }

        val gridHeightDp = gridHeightDp(size, showAxis)
        val gridWidthDp = size.widthDp - 2 * CARD_PADDING_DP -
            (if (showAxis) AXIS_WIDTH_DP else 0f)
        val dayWidthDp = if (weekView.days.isEmpty()) {
            gridWidthDp
        } else {
            gridWidthDp / weekView.days.size
        }

        // Grid lines pair with the time axis: a bare grid without the axis
        // sidebar reads as noise, so both appear and disappear together.
        if (showAxis) {
            // Lines first (behind blocks), exactly like the ArkTS Stack ordering.
            for (row in weekView.rows) {
                if (row.kind != "hour" && row.kind != "gap") {
                    continue
                }
                val line = newRemoteViews(context, R.layout.widget_week_line)
                line.setViewLayoutMargin(
                    R.id.widget_line,
                    RemoteViews.MARGIN_TOP,
                    fraction(row.top, gridHeightDp),
                    TypedValue.COMPLEX_UNIT_DIP,
                )
                rv.addView(R.id.widget_week_grid_cells, line)
            }
        }

        for (block in weekView.blocks) {
            rv.addView(
                R.id.widget_week_grid_cells,
                renderBlock(context, block, weekView, dayWidthDp, gridHeightDp, showAxis),
            )
        }

        if (showAxis) {
            for (row in weekView.rows) {
                rv.addView(R.id.widget_week_axis, renderAxisRow(context, row, weekView, gridHeightDp))
            }
        }
        return rv
    }

    private fun renderBlock(
        context: Context,
        block: WidgetWeekBlock,
        weekView: WidgetWeekView,
        dayWidthDp: Float,
        gridHeightDp: Float,
        wide: Boolean,
    ): RemoteViews {
        val blockHeightDp = fraction(block.height, gridHeightDp)
        val dayIndex = weekView.days.indexOfFirst { it.dayOfWeek == block.dayOfWeek }
        val leftDp = if (dayIndex < 0) 0f else dayIndex * dayWidthDp

        val blockRv = newRemoteViews(context, R.layout.widget_week_block)
        blockRv.setViewLayoutWidth(R.id.widget_block, dayWidthDp, TypedValue.COMPLEX_UNIT_DIP)
        blockRv.setViewLayoutHeight(R.id.widget_block, blockHeightDp, TypedValue.COMPLEX_UNIT_DIP)
        blockRv.setViewLayoutMargin(
            R.id.widget_block,
            RemoteViews.MARGIN_START,
            leftDp,
            TypedValue.COMPLEX_UNIT_DIP,
        )
        blockRv.setViewLayoutMargin(
            R.id.widget_block,
            RemoteViews.MARGIN_TOP,
            fraction(block.top, gridHeightDp),
            TypedValue.COMPLEX_UNIT_DIP,
        )
        blockRv.setInt(
            R.id.widget_block_inner,
            "setBackgroundResource",
            WidgetPalette.weekBlock(block.fill),
        )

        // Detail degradation order: time, second location line, second name
        // line, then location. The name always keeps at least one line.
        val level = detailLevel(blockHeightDp)
        val inset = if (blockHeightDp >= 10) 1 else 0
        blockRv.setViewPadding(
            R.id.widget_block_inner,
            dpToPx(context, 2f).toInt(),
            dpToPx(context, (inset + 1).toFloat()).toInt(),
            dpToPx(context, 2f).toInt(),
            dpToPx(context, inset.toFloat()).toInt(),
        )
        // WeekCard.ets nameFontSize(): the 6*4 (axis) variant allows 10sp.
        val nameFontSize = minOf(
            if (wide) 10f else 9f,
            maxOf(1f, blockHeightDp - inset * 2),
        )
        val secondaryFontSize = maxOf(5f, minOf(if (wide) 8f else 7f, nameFontSize - 1))
        blockRv.setTextViewText(R.id.widget_block_name, block.item.name)
        blockRv.setInt(R.id.widget_block_name, "setMaxLines", if (!block.compact && level >= 3) 2 else 1)
        blockRv.setTextViewTextSize(R.id.widget_block_name, TypedValue.COMPLEX_UNIT_SP, nameFontSize)
        blockRv.setInt(R.id.widget_block_name, "setLineHeight", spToPx(context, nameFontSize).toInt())
        blockRv.setTextColor(R.id.widget_block_name, parseColor(block.textColor))

        if (block.timeLabel.isNotEmpty() && !block.compact && level >= 5) {
            blockRv.setTextViewText(R.id.widget_block_time, block.timeLabel)
            blockRv.setTextViewTextSize(
                R.id.widget_block_time,
                TypedValue.COMPLEX_UNIT_SP,
                secondaryFontSize,
            )
            blockRv.setInt(
                R.id.widget_block_time,
                "setLineHeight",
                spToPx(context, secondaryFontSize).toInt(),
            )
            blockRv.setTextColor(R.id.widget_block_time, parseColor(block.textColor))
            blockRv.setViewVisibility(R.id.widget_block_time, View.VISIBLE)
        } else {
            blockRv.setViewVisibility(R.id.widget_block_time, View.GONE)
        }
        if (block.item.loc.isNotEmpty() && !block.compact && level >= 2) {
            blockRv.setTextViewText(R.id.widget_block_loc, "@${block.item.loc}")
            blockRv.setInt(
                R.id.widget_block_loc,
                "setMaxLines",
                if (level >= 4) 2 else 1,
            )
            blockRv.setTextViewTextSize(
                R.id.widget_block_loc,
                TypedValue.COMPLEX_UNIT_SP,
                secondaryFontSize,
            )
            blockRv.setInt(
                R.id.widget_block_loc,
                "setLineHeight",
                spToPx(context, secondaryFontSize).toInt(),
            )
            blockRv.setTextColor(R.id.widget_block_loc, parseColor(block.textColor))
            blockRv.setViewVisibility(R.id.widget_block_loc, View.VISIBLE)
        } else {
            blockRv.setViewVisibility(R.id.widget_block_loc, View.GONE)
        }
        return blockRv
    }

    // WeekCard.ets axisRow(): period numbers with optional times, or plain hour
    // labels when the schedule does not use class periods.
    private fun renderAxisRow(
        context: Context,
        row: WidgetWeekRow,
        weekView: WidgetWeekView,
        gridHeightDp: Float,
    ): RemoteViews {
        val rowRv = newRemoteViews(context, R.layout.widget_week_axis_row)
        rowRv.setViewLayoutHeight(
            R.id.widget_axis_row,
            fraction(row.height, gridHeightDp),
            TypedValue.COMPLEX_UNIT_DIP,
        )
        rowRv.setViewLayoutMargin(
            R.id.widget_axis_row,
            RemoteViews.MARGIN_TOP,
            fraction(row.top, gridHeightDp),
            TypedValue.COMPLEX_UNIT_DIP,
        )
        val showTimes = weekView.showAxisTimes && fraction(row.height, gridHeightDp) >= 24f
        if (weekView.classPeriods && row.period != null) {
            rowRv.setTextViewText(R.id.widget_axis_period, row.period.toString())
            rowRv.setViewVisibility(R.id.widget_axis_period, View.VISIBLE)
            if (showTimes) {
                rowRv.setTextViewText(R.id.widget_axis_begin, row.begin)
                rowRv.setTextViewText(R.id.widget_axis_end, row.end)
                rowRv.setViewVisibility(R.id.widget_axis_begin, View.VISIBLE)
                rowRv.setViewVisibility(R.id.widget_axis_end, View.VISIBLE)
            } else {
                rowRv.setViewVisibility(R.id.widget_axis_begin, View.GONE)
                rowRv.setViewVisibility(R.id.widget_axis_end, View.GONE)
            }
            rowRv.setViewVisibility(R.id.widget_axis_hour, View.GONE)
        } else if (!weekView.classPeriods && row.kind == "hour") {
            rowRv.setTextViewText(R.id.widget_axis_hour, row.begin)
            rowRv.setViewVisibility(R.id.widget_axis_hour, View.VISIBLE)
            rowRv.setViewVisibility(R.id.widget_axis_period, View.GONE)
            rowRv.setViewVisibility(R.id.widget_axis_begin, View.GONE)
            rowRv.setViewVisibility(R.id.widget_axis_end, View.GONE)
        } else {
            rowRv.setViewVisibility(R.id.widget_axis_period, View.GONE)
            rowRv.setViewVisibility(R.id.widget_axis_begin, View.GONE)
            rowRv.setViewVisibility(R.id.widget_axis_end, View.GONE)
            rowRv.setViewVisibility(R.id.widget_axis_hour, View.GONE)
        }
        return rowRv
    }

    // WeekCard.ets legacyWeek(): pre-weekView snapshots (and, on Android, also
    // pre-API-31 devices) get the simple flow layout. The first column is
    // tinted exactly like the ArkTS original (index === 0), not the real today.
    private fun renderLegacy(
        context: Context,
        snapshot: WidgetSnapshot,
        weekView: WidgetWeekView?,
    ): RemoteViews {
        val rv = newRemoteViews(context, R.layout.widget_week_legacy)
        val days = weekView?.days ?: snapshot.nextDays
        val sc = WidgetStrings.context(context, snapshot)
        rv.setTextViewText(
            R.id.widget_week_title,
            sc.getString(R.string.widget_week_header),
        )
        rv.setTextViewText(
            R.id.widget_week_label,
            sc.getString(R.string.widget_week_label, weekView?.week ?: snapshot.week),
        )
        rv.setViewVisibility(R.id.widget_week_empty, View.GONE)
        rv.removeAllViews(R.id.widget_legacy_headings)
        rv.removeAllViews(R.id.widget_legacy_row)
        for ((index, day) in days.withIndex()) {
            val heading = newRemoteViews(context, R.layout.widget_legacy_day_heading)
            heading.setTextViewText(R.id.widget_legacy_heading_label, day.label)
            heading.setTextViewText(R.id.widget_legacy_heading_date, day.date)
            rv.addView(R.id.widget_legacy_headings, heading)

            val column = newRemoteViews(
                context,
                if (index == 0) R.layout.widget_legacy_day_col_first else R.layout.widget_legacy_day_col,
            )
            for (item in day.items) {
                val block = newRemoteViews(context, R.layout.widget_legacy_block)
                block.setTextViewText(R.id.widget_lblock_name, item.name)
                block.setInt(
                    R.id.widget_lblock,
                    "setBackgroundResource",
                    WidgetPalette.legacyBlock(item.color),
                )
                column.addView(R.id.widget_legacy_col, block)
            }
            rv.addView(R.id.widget_legacy_row, column)
        }
        return rv
    }

    private fun isToday(snapshot: WidgetSnapshot, day: WidgetDay): Boolean =
        snapshot.today.date == day.date

    private fun gridHeightDp(size: WidgetSize, showAxis: Boolean): Float {
        val scale = size.fontScale
        val chrome = (HEADER_DP + HEADINGS_DP) * scale
        return maxOf(60f, size.heightDp - 2 * CARD_PADDING_DP - chrome)
    }

    private fun detailLevel(blockHeightDp: Float): Int = when {
        blockHeightDp >= 54 -> 5
        blockHeightDp >= 40 -> 4
        blockHeightDp >= 30 -> 3
        blockHeightDp >= 20 -> 2
        else -> 1
    }

    private fun parseColor(text: String): Int = try {
        android.graphics.Color.parseColor(text)
    } catch (_: IllegalArgumentException) {
        android.graphics.Color.WHITE
    }
}
