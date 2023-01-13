package com.unidy2002.thuinfo

import android.content.res.Configuration
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName() = "thu_info"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        reactInstanceManager.onConfigurationChanged(this, newConfig)
    }

    /**
     * Returns the instance of the [ReactActivityDelegate]. Here we use a util class [DefaultReactActivityDelegate]
     * which allows you to easily enable Fabric and Concurrent React (aka React 18) with two boolean flags.
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate = DefaultReactActivityDelegate(
        this,
        mainComponentName,
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.fabricEnabled, // fabricEnabled
        // If you opted-in for the New Architecture, we enable Concurrent React (i.e. React 18).
        DefaultNewArchitectureEntryPoint.concurrentReactEnabled // concurrentRootEnabled
    )
}
