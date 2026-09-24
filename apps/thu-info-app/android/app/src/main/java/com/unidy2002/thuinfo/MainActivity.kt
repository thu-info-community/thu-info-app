package com.unidy2002.thuinfo

import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.unidy2002.thuinfo.widget.WidgetLaunchStore

class MainActivity : ReactActivity() {
    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "thu_info"

    /**
     * Phones stay portrait-only, but anything at least [TABLET_SMALLEST_WIDTH_DP] wide
     * (tablets, unfolded foldables, tri-folds) is free to rotate.
     *
     * `android:screenOrientation` is a manifest attribute and cannot be resource-qualified
     * by screen size, so the policy is applied at runtime instead.
     *
     * Re-assigning the same value is skipped on purpose: the setter triggers a
     * configuration change whenever the value differs, and this also runs from
     * [onConfigurationChanged].
     */
    private fun applyOrientationPolicy() {
        val target = if (resources.configuration.smallestScreenWidthDp >= TABLET_SMALLEST_WIDTH_DP) {
            ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        } else {
            ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        if (requestedOrientation != target) {
            requestedOrientation = target
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
        // Cold start from a schedule widget: remember the launch for JS to consume.
        WidgetLaunchStore.offer(intent)
        if ((Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
        and (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM)) {
            window.setNavigationBarContrastEnforced(false)
            window.setNavigationBarColor(Color.TRANSPARENT)
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                )
        }
        applyOrientationPolicy()
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        // Unfolding a foldable changes the smallest width without recreating this activity,
        // so the policy has to be re-evaluated here too. `super` must be called first: it
        // forwards the change to ReactActivityDelegate.
        super.onConfigurationChanged(newConfig)
        applyOrientationPolicy()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        // Warm start from a schedule widget: the JS side listens for "widgetLaunch".
        WidgetLaunchStore.offer(intent)
        (application as MainApplication).reactHost.currentReactContext
            ?.emitDeviceEvent("widgetLaunch")
    }

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    companion object {
        /** Android's conventional tablet threshold (`sw600dp`). */
        private const val TABLET_SMALLEST_WIDTH_DP = 600
    }
}
