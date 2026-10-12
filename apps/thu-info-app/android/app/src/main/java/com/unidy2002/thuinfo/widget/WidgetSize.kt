package com.unidy2002.thuinfo.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProviderInfo
import android.content.Context
import android.content.res.Configuration

data class WidgetSize(val widthDp: Int, val heightDp: Int, val fontScale: Float)

object WidgetSizeReader {
    // The four option values bracket the widget rect across orientations: in
    // portrait the current size is MIN_WIDTH x MAX_HEIGHT, in landscape it is
    // MIN_HEIGHT x MAX_WIDTH (AOSP javadoc semantics).
    fun read(context: Context, manager: AppWidgetManager, appWidgetId: Int): WidgetSize {
        val info: AppWidgetProviderInfo? = manager.getAppWidgetInfo(appWidgetId)
        val options = manager.getAppWidgetOptions(appWidgetId)
        val landscape =
            context.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
        val widthKey = if (landscape) {
            AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT
        } else {
            AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH
        }
        val heightKey = if (landscape) {
            AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH
        } else {
            AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT
        }
        val optionsWidth = options?.getInt(widthKey, 0) ?: 0
        val optionsHeight = options?.getInt(heightKey, 0) ?: 0
        // First placement can deliver an empty options bundle; fall back to the
        // declared minimum size converted with the current density.
        val density = context.resources.displayMetrics.density
        val width = if (optionsWidth > 0) {
            optionsWidth
        } else {
            ((info?.minWidth ?: 0) / density).toInt()
        }
        val height = if (optionsHeight > 0) {
            optionsHeight
        } else {
            ((info?.minHeight ?: 0) / density).toInt()
        }
        return WidgetSize(width, height, context.resources.configuration.fontScale)
    }
}
