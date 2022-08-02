package com.unidy2002.thuinfo

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.soloader.SoLoader
import com.unidy2002.thuinfo.newarchitecture.MainApplicationReactNativeHost

class MainApplication : Application(), ReactApplication {
    private val mReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport() = BuildConfig.DEBUG

        override fun getPackages() = PackageList(this).packages

        override fun getJSMainModuleName() = "index"
    }

    private val mNewArchitectureNativeHost: ReactNativeHost = MainApplicationReactNativeHost(this)

    override fun getReactNativeHost() =
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) mNewArchitectureNativeHost else mReactNativeHost

    override fun onCreate() {
        super.onCreate()
        // If you opted-in for the New Architecture, we enable the TurboModule system
        ReactFeatureFlags.useTurboModules = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        SoLoader.init(this, false)
    }
}
