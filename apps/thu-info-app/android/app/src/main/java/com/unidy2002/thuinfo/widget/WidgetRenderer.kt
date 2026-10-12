package com.unidy2002.thuinfo.widget

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.unidy2002.thuinfo.MainActivity
import com.unidy2002.thuinfo.R

object WidgetRenderer {
    fun render(context: Context, kind: WidgetKind, size: WidgetSize, snapshot: WidgetSnapshot?): RemoteViews {
        val rv = when (kind) {
            WidgetKind.NEXT -> NextCardRenderer.render(context, size, snapshot)
            WidgetKind.TODAY -> TodayCardRenderer.render(context, size, snapshot)
            WidgetKind.WEEK -> WeekCardRenderer.render(context, size, snapshot)
        }
        // Every card taps through to the schedule, like the ArkTS postCardAction.
        rv.setOnClickPendingIntent(R.id.widget_root, launchPendingIntent(context, kind))
        return rv
    }

    fun launchPendingIntent(context: Context, kind: WidgetKind): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            putExtra(WidgetLaunchStore.EXTRA_WIDGET_TARGET, "schedule")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        return PendingIntent.getActivity(
            context,
            kind.ordinal,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
