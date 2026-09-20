package com.unidy2002.thuinfo.widget

import android.content.Context
import android.util.TypedValue
import android.widget.RemoteViews

internal fun newRemoteViews(context: Context, layoutId: Int): RemoteViews =
    RemoteViews(context.packageName, layoutId)

internal fun dpToPx(context: Context, dp: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, context.resources.displayMetrics)

internal fun spToPx(context: Context, sp: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, sp, context.resources.displayMetrics)

// ArkTS percentages ("63%") become dp fractions of the measured grid height.
internal fun fraction(value: Double, totalDp: Float): Float {
    val clamped = value.coerceIn(0.0, 1.0)
    return (clamped * totalDp).toFloat()
}
