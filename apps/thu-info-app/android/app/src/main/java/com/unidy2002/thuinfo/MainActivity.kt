package com.unidy2002.thuinfo

import android.os.Bundle
import android.os.Build
import android.graphics.Color
import android.view.View
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "thu_info"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
        if ((Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
        and (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM)) {
            window.setNavigationBarContrastEnforced(false)
            window.setNavigationBarColor(Color.TRANSPARENT)
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                )
        }
    }

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
