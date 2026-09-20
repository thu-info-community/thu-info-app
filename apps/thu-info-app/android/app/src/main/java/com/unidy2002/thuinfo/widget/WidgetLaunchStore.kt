package com.unidy2002.thuinfo.widget

import android.content.Intent

// Mirrors harmony's pending_launch (WidgetStore.ets): a card tap records the
// launch target; the JS side consumes it through RTNWidget.consumeLaunchParams
// within a short TTL so a stale entry can never trigger a navigation much
// later. An in-process store (instead of reading the activity intent) also
// covers the cold-start race where JS boots after onCreate already ran.
object WidgetLaunchStore {
    const val TTL_MS = 60_000L
    const val EXTRA_WIDGET_TARGET = "widget_target"

    @Volatile
    private var pendingWrittenAt: Long = 0L

    fun offer(intent: Intent?) {
        if (intent?.getStringExtra(EXTRA_WIDGET_TARGET) != null) {
            pendingWrittenAt = System.currentTimeMillis()
        }
    }

    /** Returns `{"target":"schedule"}` once, or null when absent or stale. */
    fun consume(): String? {
        val writtenAt = pendingWrittenAt
        if (writtenAt == 0L) {
            return null
        }
        pendingWrittenAt = 0L
        if (System.currentTimeMillis() - writtenAt > TTL_MS) {
            return null
        }
        return "{\"target\":\"schedule\"}"
    }
}
