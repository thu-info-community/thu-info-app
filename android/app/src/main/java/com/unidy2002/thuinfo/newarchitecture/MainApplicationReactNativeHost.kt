package com.unidy2002.thuinfo.newarchitecture

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.fabric.CoreComponentsRegistry
import com.facebook.react.fabric.FabricJSIModuleProvider
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.uimanager.ViewManagerRegistry
import com.unidy2002.thuinfo.BuildConfig
import com.unidy2002.thuinfo.newarchitecture.components.MainComponentsRegistry
import com.unidy2002.thuinfo.newarchitecture.modules.MainApplicationTurboModuleManagerDelegate

/**
 * A [ReactNativeHost] that helps you load everything needed for the New Architecture, both
 * TurboModule delegates and the Fabric Renderer.
 *
 *
 * Please note that this class is used ONLY if you opt in for the New Architecture (see the
 * `newArchEnabled` property). Is ignored otherwise.
 */
class MainApplicationReactNativeHost(application: Application) : ReactNativeHost(application) {
    override fun getUseDeveloperSupport() = BuildConfig.DEBUG

    override fun getPackages() = PackageList(this).packages

    override fun getJSMainModuleName() = "index"

    // Here we provide the ReactPackageTurboModuleManagerDelegate Builder. This is necessary
    // for the new architecture and to use TurboModules correctly.
    override fun getReactPackageTurboModuleManagerDelegateBuilder() =
        MainApplicationTurboModuleManagerDelegate.Builder()

    override fun getJSIModulePackage() = JSIModulePackage { reactApplicationContext, _ ->
        // Here we provide a new JSIModuleSpec that will be responsible for providing the
        // custom Fabric Components.
        listOf(object : JSIModuleSpec<UIManager> {
            override fun getJSIModuleType() = JSIModuleType.UIManager

            override fun getJSIModuleProvider(): JSIModuleProvider<UIManager> {
                val componentFactory = ComponentFactory()
                CoreComponentsRegistry.register(componentFactory)

                // Here we register a Components Registry.
                // The one that is generated with the template contains no components
                // and just provides you the one from React Native core.
                MainComponentsRegistry.register(componentFactory)
                val reactInstanceManager = reactInstanceManager
                val viewManagerRegistry = ViewManagerRegistry(
                    reactInstanceManager.getOrCreateViewManagers(reactApplicationContext)
                )
                return FabricJSIModuleProvider(
                    reactApplicationContext,
                    componentFactory,
                    ReactNativeConfig.DEFAULT_CONFIG,
                    viewManagerRegistry
                )
            }
        })
    }
}
