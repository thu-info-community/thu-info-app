package com.unidy2002.thuinfo.widget

import com.unidy2002.thuinfo.R

// The 11-color course palette is a fixed constant in the app
// (src/assets/colors/light.ts courseItemColorList — identical in light and
// dark themes, and the JS snapshot builder always uses the light list). Each
// color is pre-baked as a rounded drawable so RemoteViews can apply it on every
// API level without the API-31-only tinting APIs. Keep the two lists in sync.
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

    // Radius 2, opaque — TodayCard color bars.
    private val BARS = mapOf(
        "00a6f2" to R.drawable.widget_bar_00a6f2,
        "3cb3c8" to R.drawable.widget_bar_3cb3c8,
        "fc6b50" to R.drawable.widget_bar_fc6b50,
        "f067bb" to R.drawable.widget_bar_f067bb,
        "ef5b75" to R.drawable.widget_bar_ef5b75,
        "7d7aea" to R.drawable.widget_bar_7d7aea,
        "bf73e5" to R.drawable.widget_bar_bf73e5,
        "ff9900" to R.drawable.widget_bar_ff9900,
        "eebe00" to R.drawable.widget_bar_eebe00,
        "5b8eff" to R.drawable.widget_bar_5b8eff,
        "139161" to R.drawable.widget_bar_139161,
    )

    // Radius 3, #44 alpha — WeekCard blocks in the new schedule UI.
    private val NEW_UI_BLOCKS = mapOf(
        "00a6f2" to R.drawable.widget_nblock_00a6f2,
        "3cb3c8" to R.drawable.widget_nblock_3cb3c8,
        "fc6b50" to R.drawable.widget_nblock_fc6b50,
        "f067bb" to R.drawable.widget_nblock_f067bb,
        "ef5b75" to R.drawable.widget_nblock_ef5b75,
        "7d7aea" to R.drawable.widget_nblock_7d7aea,
        "bf73e5" to R.drawable.widget_nblock_bf73e5,
        "ff9900" to R.drawable.widget_nblock_ff9900,
        "eebe00" to R.drawable.widget_nblock_eebe00,
        "5b8eff" to R.drawable.widget_nblock_5b8eff,
        "139161" to R.drawable.widget_nblock_139161,
    )

    // Radius 3, opaque — WeekCard mirrored blocks when the schedule new UI is
    // disabled (the JS builder then keeps fill opaque).
    private val MIRRORED_OPAQUE = mapOf(
        "00a6f2" to R.drawable.widget_mblock_00a6f2,
        "3cb3c8" to R.drawable.widget_mblock_3cb3c8,
        "fc6b50" to R.drawable.widget_mblock_fc6b50,
        "f067bb" to R.drawable.widget_mblock_f067bb,
        "ef5b75" to R.drawable.widget_mblock_ef5b75,
        "7d7aea" to R.drawable.widget_mblock_7d7aea,
        "bf73e5" to R.drawable.widget_mblock_bf73e5,
        "ff9900" to R.drawable.widget_mblock_ff9900,
        "eebe00" to R.drawable.widget_mblock_eebe00,
        "5b8eff" to R.drawable.widget_mblock_5b8eff,
        "139161" to R.drawable.widget_mblock_139161,
    )

    // Radius 4, opaque — WeekCard legacy blocks (old schedule UI).
    private val LEGACY_BLOCKS = mapOf(
        "00a6f2" to R.drawable.widget_lblock_00a6f2,
        "3cb3c8" to R.drawable.widget_lblock_3cb3c8,
        "fc6b50" to R.drawable.widget_lblock_fc6b50,
        "f067bb" to R.drawable.widget_lblock_f067bb,
        "ef5b75" to R.drawable.widget_lblock_ef5b75,
        "7d7aea" to R.drawable.widget_lblock_7d7aea,
        "bf73e5" to R.drawable.widget_lblock_bf73e5,
        "ff9900" to R.drawable.widget_lblock_ff9900,
        "eebe00" to R.drawable.widget_lblock_eebe00,
        "5b8eff" to R.drawable.widget_lblock_5b8eff,
        "139161" to R.drawable.widget_lblock_139161,
    )

    private fun normalize(hex: String): String = hex.removePrefix("#").lowercase()

    fun bar(hex: String): Int = BARS[normalize(hex)] ?: BARS[HEXES.first()]!!

    // WeekCard.ets paints .backgroundColor(block.fill) verbatim: the JS builder
    // only prepends the 44 alpha for the new schedule UI, so an 8-digit fill is
    // translucent (the drawable bakes that alpha in) and a 6-digit one is opaque.
    fun weekBlock(fill: String): Int {
        val bare = normalize(fill)
        return if (bare.length == 8) {
            NEW_UI_BLOCKS[bare.substring(2)] ?: NEW_UI_BLOCKS[HEXES.first()]!!
        } else {
            MIRRORED_OPAQUE[bare] ?: MIRRORED_OPAQUE[HEXES.first()]!!
        }
    }

    fun legacyBlock(hex: String): Int =
        LEGACY_BLOCKS[normalize(hex)] ?: LEGACY_BLOCKS[HEXES.first()]!!
}
