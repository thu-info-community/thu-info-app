package com.unidy2002.thuinfo

import android.content.res.Configuration
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName() = "thu_info"

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        reactInstanceManager.onConfigurationChanged(this, newConfig)
    }
}
