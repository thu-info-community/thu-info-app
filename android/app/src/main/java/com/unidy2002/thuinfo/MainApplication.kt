package com.unidy2002.thuinfo

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
    private val mReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport() = BuildConfig.DEBUG

        override fun getPackages() = PackageList(this).packages

        override fun getJSMainModuleName() = "index"
    }

    override fun getReactNativeHost() = mReactNativeHost

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }
}
