package com.unidy2002.thuinfo.widget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

// Data model shared with the JS side (src/utils/scheduleWidget.ts) and the
// HarmonyOS cards — mirrors harmony/entry/src/main/ets/widget/common/WidgetModels.ets.
// `begin`/`end` are epoch milliseconds; `top`/`height` in the week view are
// normalized 0..1 fractions of the cropped grid.
data class WidgetItem(
    val name: String,
    val loc: String,
    val from: String,
    val to: String,
    val begin: Long,
    val end: Long,
    val color: String,
)

data class WidgetDay(
    val dayOfWeek: Int,
    val date: String,
    val label: String,
    // Full localized date line for the Today card header; empty in snapshots
    // written before the field existed (renderers fall back to "date label").
    val dateText: String = "",
    val items: List<WidgetItem>,
)

data class WidgetWeekRow(
    val kind: String,
    val period: Int?,
    val begin: String,
    val end: String,
    val top: Double,
    val height: Double,
)

data class WidgetWeekBlock(
    val item: WidgetItem,
    val dayOfWeek: Int,
    val top: Double,
    val height: Double,
    val timeLabel: String,
    val compact: Boolean,
    val fill: String,
    val textColor: String,
)

data class WidgetWeekView(
    val week: Int,
    val days: List<WidgetDay>,
    val rows: List<WidgetWeekRow>,
    val blocks: List<WidgetWeekBlock>,
    val classPeriods: Boolean,
    val showWeekend: Boolean,
    val showAxisTimes: Boolean,
)

data class WidgetSnapshot(
    val generatedAt: Long,
    val week: Int,
    // Resolved app language ("zh"/"en"); renderers resolve string resources
    // against it so the cards never mix the app language with the system's.
    val language: String = "",
    val today: WidgetDay,
    val tomorrow: WidgetDay,
    val nextDays: List<WidgetDay>,
    val weekView: WidgetWeekView?,
    val empty: Boolean,
)

/** The first not-yet-finished item, together with the day that contains it. */
data class NextPick(val day: WidgetDay, val item: WidgetItem)

object WidgetSnapshotParser {
    fun parse(text: String): WidgetSnapshot? {
        if (text.isEmpty()) {
            return null
        }
        return try {
            val root = JSONObject(text)
            if (root.optInt("v") != 1) {
                return null
            }
            val nextDays = parseDays(root.optJSONArray("nextDays"))
            if (nextDays.isEmpty()) {
                return null
            }
            WidgetSnapshot(
                generatedAt = root.optLong("generatedAt", 0L),
                week = root.optInt("week", 0),
                language = root.optString("language"),
                today = parseDay(root.optJSONObject("today"))
                    ?: WidgetDay(1, "", "", items = emptyList()),
                tomorrow = parseDay(root.optJSONObject("tomorrow"))
                    ?: WidgetDay(1, "", "", items = emptyList()),
                nextDays = nextDays,
                weekView = parseWeekView(root.optJSONObject("weekView")),
                empty = root.optBoolean("empty", false),
            )
        } catch (_: Exception) {
            null
        }
    }

    // The first item that has not finished yet across the (already sorted,
    // consecutive) days of the snapshot — "now" in epoch milliseconds.
    fun pickNext(snapshot: WidgetSnapshot, now: Long): NextPick? {
        for (day in snapshot.nextDays) {
            for (item in day.items) {
                if (item.end > now) {
                    return NextPick(day, item)
                }
            }
        }
        return null
    }

    private fun parseDays(array: JSONArray?): List<WidgetDay> {
        if (array == null) {
            return emptyList()
        }
        val days = mutableListOf<WidgetDay>()
        for (i in 0 until array.length()) {
            parseDay(array.optJSONObject(i))?.let { days.add(it) }
        }
        return days
    }

    private fun parseDay(obj: JSONObject?): WidgetDay? {
        obj ?: return null
        val items = mutableListOf<WidgetItem>()
        val itemArray = obj.optJSONArray("items")
        if (itemArray != null) {
            for (i in 0 until itemArray.length()) {
                val item = itemArray.optJSONObject(i) ?: continue
                items.add(
                    WidgetItem(
                        name = item.optString("name"),
                        loc = item.optString("loc"),
                        from = item.optString("from"),
                        to = item.optString("to"),
                        begin = item.optLong("begin", 0L),
                        end = item.optLong("end", 0L),
                        color = item.optString("color"),
                    ),
                )
            }
        }
        return WidgetDay(
            dayOfWeek = obj.optInt("dayOfWeek", 1),
            date = obj.optString("date"),
            label = obj.optString("label"),
            dateText = obj.optString("dateText"),
            items = items,
        )
    }

    private fun parseWeekView(obj: JSONObject?): WidgetWeekView? {
        obj ?: return null
        val rows = mutableListOf<WidgetWeekRow>()
        val rowArray = obj.optJSONArray("rows")
        if (rowArray != null) {
            for (i in 0 until rowArray.length()) {
                val row = rowArray.optJSONObject(i) ?: continue
                val period = if (row.has("period") && !row.isNull("period")) {
                    row.optInt("period")
                } else {
                    null
                }
                rows.add(
                    WidgetWeekRow(
                        kind = row.optString("kind"),
                        period = period,
                        begin = row.optString("begin"),
                        end = row.optString("end"),
                        top = row.optDouble("top", 0.0),
                        height = row.optDouble("height", 0.0),
                    ),
                )
            }
        }
        val blocks = mutableListOf<WidgetWeekBlock>()
        val blockArray = obj.optJSONArray("blocks")
        if (blockArray != null) {
            for (i in 0 until blockArray.length()) {
                val block = blockArray.optJSONObject(i) ?: continue
                // A block carries the flattened item fields plus layout extras.
                blocks.add(
                    WidgetWeekBlock(
                        item = WidgetItem(
                            name = block.optString("name"),
                            loc = block.optString("loc"),
                            from = block.optString("from"),
                            to = block.optString("to"),
                            begin = block.optLong("begin", 0L),
                            end = block.optLong("end", 0L),
                            color = block.optString("color"),
                        ),
                        dayOfWeek = block.optInt("dayOfWeek", 1),
                        top = block.optDouble("top", 0.0),
                        height = block.optDouble("height", 0.0),
                        timeLabel = block.optString("timeLabel"),
                        compact = block.optBoolean("compact", false),
                        fill = block.optString("fill"),
                        textColor = block.optString("textColor"),
                    ),
                )
            }
        }
        val days = parseDays(obj.optJSONArray("days"))
        return WidgetWeekView(
            week = obj.optInt("week", 0),
            days = days,
            rows = rows,
            blocks = blocks,
            classPeriods = obj.optBoolean("classPeriods", true),
            showWeekend = obj.optBoolean("showWeekend", false),
            showAxisTimes = obj.optBoolean("showAxisTimes", false),
        )
    }
}

// Same preference file name as harmony/entry/src/main/ets/widget/WidgetStore.ets;
// the provider reads the snapshot written by the RN module.
object WidgetSnapshotStore {
    const val PREFS = "thuinfo_widget_snapshot"
    const val KEY_SNAPSHOT = "snapshot"

    fun read(context: Context): WidgetSnapshot? =
        WidgetSnapshotParser.parse(
            context
                .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_SNAPSHOT, "") ?: "",
        )

    fun write(context: Context, json: String) {
        context
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_SNAPSHOT, json)
            .apply()
    }
}
