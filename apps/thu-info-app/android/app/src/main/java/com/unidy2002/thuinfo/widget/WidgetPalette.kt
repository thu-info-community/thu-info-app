package com.unidy2002.thuinfo.widget

import android.graphics.Color

// The 11-color course palette is a fixed constant in the app
// (src/assets/colors/light.ts courseItemColorList — identical in light and
// dark themes, and the JS snapshot builder always uses the light list). Keep
// the list in sync with the level-list drawables widget_bar.xml and
// widget_lblock.xml: the entry index is the drawable level the renderers set.
object WidgetPalette {
    private val HEXES = listOf(
        "00a6f2",
        "3cb3c8",
        "fc6b50",
        "f067bb",
        "ef5b75",
        "7d7aea",
        "bf73e5",
        "ff9900",
        "eebe00",
        "5b8eff",
        "139161",
    )

    private fun normalize(hex: String): String = hex.removePrefix("#").lowercase()

    // Level-list index for the ImageView-backed shapes (setImageLevel is a
    // RemoteViews-callable setter on every API level): the Today rows use
    // widget_bar.xml and the Week legacy blocks widget_lblock.xml — same
    // colors, different radii. Unknown colors fall back to the first entry.
    fun bar(hex: String): Int = HEXES.indexOf(normalize(hex)).coerceAtLeast(0)

    // WeekCard.ets paints .backgroundColor(block.fill) verbatim: the JS builder
    // only prepends the 44 alpha for the new schedule UI, so an 8-digit fill is
    // translucent and a 6-digit one is opaque — parsing it directly reproduces
    // both on the shared white shape (widget_block_bg.xml), which the mirrored
    // card tints through setBackgroundTintList (API 31+, its only home).
    fun weekBlockTint(fill: String): Int = try {
        Color.parseColor(fill)
    } catch (_: IllegalArgumentException) {
        Color.parseColor("#FF${HEXES.first()}")
    }
}
