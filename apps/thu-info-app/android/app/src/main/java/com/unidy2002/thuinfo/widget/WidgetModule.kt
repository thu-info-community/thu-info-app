package com.unidy2002.thuinfo.widget

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.Executors

// Android implementation of packages/RTNWidget/src/specs/v2/NativeWidget.ts,
// mirroring harmony/entry/src/main/ets/turbomodule/WidgetModule.ets. Registered
// as "RTNWidget" so the existing JS resolution picks it up.
@ReactModule(name = WidgetModule.NAME)
class WidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = NAME

    @ReactMethod
    fun updateScheduleSnapshot(snapshot: String, promise: Promise) {
        // Binder calls must not run on the JS/native-modules thread.
        executor.execute {
            try {
                ScheduleWidgetProvider.pushAll(reactApplicationContext, snapshot)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PUSH_FAILED", e)
            }
        }
    }

    @ReactMethod
    fun consumeLaunchParams(promise: Promise) {
        // Reject stale entries: a tap whose params never reached the running
        // instance must not navigate later (same TTL as harmony).
        promise.resolve(WidgetLaunchStore.consume())
    }

    companion object {
        const val NAME = "RTNWidget"

        private val executor = Executors.newSingleThreadExecutor()
    }
}
