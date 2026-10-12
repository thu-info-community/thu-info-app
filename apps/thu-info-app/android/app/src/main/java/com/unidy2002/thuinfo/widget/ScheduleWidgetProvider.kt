package com.unidy2002.thuinfo.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.os.Bundle

// One base provider + one tiny subclass per card, each with its own
// appwidget-provider metadata — the standard multi-widget pattern. The
// rendering itself is shared and driven by the measured widget size.
abstract class ScheduleWidgetProvider : AppWidgetProvider() {
    protected abstract val kind: WidgetKind

    override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateOne(context, kind, appWidgetId)
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        manager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle?,
    ) {
        updateOne(context, kind, appWidgetId)
    }

    companion object {
        fun updateOne(context: Context, kind: WidgetKind, appWidgetId: Int) {
            val manager = AppWidgetManager.getInstance(context) ?: return
            val size = WidgetSizeReader.read(context, manager, appWidgetId)
            val snapshot = WidgetSnapshotStore.read(context)
            manager.updateAppWidget(
                appWidgetId,
                WidgetRenderer.render(context, kind, size, snapshot),
            )
        }

        // Called by WidgetModule after a snapshot push: re-render every live
        // instance of every card (AppWidgetManager replaces harmony's
        // live-forms registry).
        fun pushAll(context: Context, snapshotJson: String) {
            val manager = AppWidgetManager.getInstance(context) ?: return
            WidgetSnapshotStore.write(context, snapshotJson)
            val snapshot = WidgetSnapshotParser.parse(snapshotJson)
            val providers = mapOf(
                WidgetKind.NEXT to NextScheduleWidget::class.java,
                WidgetKind.TODAY to TodayScheduleWidget::class.java,
                WidgetKind.WEEK to WeekScheduleWidget::class.java,
            )
            for ((kind, cls) in providers) {
                val ids = manager.getAppWidgetIds(ComponentName(context, cls))
                for (appWidgetId in ids) {
                    val size = WidgetSizeReader.read(context, manager, appWidgetId)
                    manager.updateAppWidget(
                        appWidgetId,
                        WidgetRenderer.render(context, kind, size, snapshot),
                    )
                }
            }
        }
    }
}

class NextScheduleWidget : ScheduleWidgetProvider() {
    override val kind = WidgetKind.NEXT
}

class TodayScheduleWidget : ScheduleWidgetProvider() {
    override val kind = WidgetKind.TODAY
}

class WeekScheduleWidget : ScheduleWidgetProvider() {
    override val kind = WidgetKind.WEEK
}
