package com.unidy2002.thuinfo

import android.app.Application
import android.content.Context
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.soloader.SoLoader
import java.lang.reflect.InvocationTargetException

class MainApplication : Application(), ReactApplication {
    private val mReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport() = BuildConfig.DEBUG

        // Packages that cannot be auto-linked yet can be added manually here.
        override fun getPackages() = PackageList(this).packages

        override fun getJSMainModuleName() = "index"
    }

    override fun getReactNativeHost() = mReactNativeHost

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
        initializeFlipper(this, reactNativeHost.reactInstanceManager)
    }

    companion object {
        /**
         * Loads Flipper in React Native templates. Call this in the onCreate method with something like
         * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
         *
         * @param context
         * @param reactInstanceManager
         */
        private fun initializeFlipper(context: Context, reactInstanceManager: ReactInstanceManager) {
            if (BuildConfig.DEBUG) {
                try {
                    // We use reflection here to pick up the class that initializes Flipper,
                    // since Flipper library is not available in release mode
                    Class.forName("com.thu_info.ReactNativeFlipper")
                            .getMethod("initializeFlipper", Context::class.java, ReactInstanceManager::class.java)
                            .invoke(null, context, reactInstanceManager)
                } catch (e: ClassNotFoundException) {
                    e.printStackTrace()
                } catch (e: NoSuchMethodException) {
                    e.printStackTrace()
                } catch (e: IllegalAccessException) {
                    e.printStackTrace()
                } catch (e: InvocationTargetException) {
                    e.printStackTrace()
                }
            }
        }
    }
}