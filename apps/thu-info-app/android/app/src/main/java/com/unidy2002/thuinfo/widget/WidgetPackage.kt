package com.unidy2002.thuinfo.widget

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

// Registered manually in MainApplication (the widget code is app-specific).
// In this RN 0.87 bridgeless runtime a manually-registered module flagged as a
// turbo module is created by the delegate and then dropped; the legacy interop
// shape (isTurboModule=false, module NOT implementing the TurboModule
// interface) is the one that actually resolves through NativeModules.
class WidgetPackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        if (name == WidgetModule.NAME) {
            WidgetModule(reactContext)
        } else {
            null
        }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
        ReactModuleInfoProvider {
            mapOf(
                WidgetModule.NAME to ReactModuleInfo(
                    WidgetModule.NAME,
                    WidgetModule::class.java.name,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    false, // isCxxModule
                    false, // isTurboModule (legacy interop shape)
                ),
            )
        }
}
