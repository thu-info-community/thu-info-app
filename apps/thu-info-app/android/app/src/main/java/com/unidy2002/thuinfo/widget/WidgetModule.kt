package com.unidy2002.thuinfo.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.Executors
import org.json.JSONArray
import org.json.JSONObject

// Android implementation of packages/RTNWidget/src/specs/v2/NativeWidget.ts,
// mirroring harmony/entry/src/main/ets/turbomodule/WidgetModule.ets. Registered
// as "RTNWidget" so the existing JS resolution picks it up.
@ReactModule(name = WidgetModule.NAME)
class WidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = NAME

    @ReactMethod
    fun updateScheduleSnapshot(snapshot: String, promise: Promise) {
        try {
            // Binder calls must not run on the JS/native-modules thread.
            executor.execute {
                try {
                    ScheduleWidgetProvider.pushAll(reactApplicationContext, snapshot)
                    promise.resolve(true)
                } catch (e: Exception) {
                    promise.reject("PUSH_FAILED", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("STORE_FAILED", e)
        }
    }

    @ReactMethod
    fun consumeLaunchParams(promise: Promise) {
        // Reject stale entries: a tap whose params never reached the running
        // instance must not navigate later (same TTL as harmony).
        promise.resolve(WidgetLaunchStore.consume())
    }

    @ReactMethod
    fun getWidgetStats(promise: Promise) {
        try {
            promise.resolve(buildStats())
        } catch (e: Exception) {
            promise.reject("STATS_FAILED", e)
        }
    }

    private fun buildStats(): String {
        val context = reactApplicationContext
        val manager = AppWidgetManager.getInstance(context)
        val snapshotText = context
            .getSharedPreferences(WidgetSnapshotStore.PREFS, Context.MODE_PRIVATE)
            .getString(WidgetSnapshotStore.KEY_SNAPSHOT, "") ?: ""
        var generatedAt = 0L
        try {
            generatedAt = JSONObject(snapshotText).optLong("generatedAt", 0L)
        } catch (_: Exception) {
            // Snapshot never written.
        }
        val forms = JSONArray()
        var liveForms = 0
        if (manager != null) {
            for ((name, cls) in mapOf(
                "schedule_next" to NextScheduleWidget::class.java,
                "schedule_today" to TodayScheduleWidget::class.java,
                "schedule_week" to WeekScheduleWidget::class.java,
            )) {
                val ids = manager.getAppWidgetIds(ComponentName(context, cls))
                liveForms += ids.size
                for (id in ids) {
                    val size = WidgetSizeReader.read(context, manager, id)
                    val dimension = when (name) {
                        "schedule_next" -> WidgetVariants.nextVariant(size.heightDp)
                        "schedule_today" -> WidgetVariants.todayVariant(size.heightDp)
                        else -> WidgetVariants.weekVariant(size.heightDp)
                    }
                    forms.put(
                        JSONObject()
                            .put("name", name)
                            .put("dimension", dimension),
                    )
                }
            }
        }
        return JSONObject()
            .put("liveForms", liveForms)
            .put("forms", forms)
            .put(
                "snapshotAgeMs",
                if (generatedAt == 0L) -1 else System.currentTimeMillis() - generatedAt,
            )
            .toString()
    }

    companion object {
        const val NAME = "RTNWidget"

        private val executor = Executors.newSingleThreadExecutor()
    }
}
