package com.unidy2002.thuinfo.newarchitecture.modules

import com.facebook.jni.HybridData
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.soloader.SoLoader

/**
 * Class responsible to load the TurboModules. This class has native methods and needs a
 * corresponding C++ implementation/header file to work correctly (already placed inside the jni/
 * folder for you).
 *
 *
 * Please note that this class is used ONLY if you opt in for the New Architecture (see the
 * `newArchEnabled` property). Is ignored otherwise.
 */
class MainApplicationTurboModuleManagerDelegate private constructor(
    reactApplicationContext: ReactApplicationContext, packages: List<ReactPackage>
) : ReactPackageTurboModuleManagerDelegate(reactApplicationContext, packages) {

    external override fun initHybrid(): HybridData

    external fun canCreateTurboModule(moduleName: String): Boolean

    class Builder : ReactPackageTurboModuleManagerDelegate.Builder() {
        override fun build(
            context: ReactApplicationContext, packages: List<ReactPackage>
        ) = MainApplicationTurboModuleManagerDelegate(context, packages)
    }

    @Synchronized
    override fun maybeLoadOtherSoLibraries() {
        if (!sIsSoLibraryLoaded) {
            // If you change the name of your application .so file in the Android.mk file,
            // make sure you update the name here as well.
            SoLoader.loadLibrary("thuinfo_appmodules")
            sIsSoLibraryLoaded = true
        }
    }

    companion object {
        @Volatile
        private var sIsSoLibraryLoaded = false
    }
}