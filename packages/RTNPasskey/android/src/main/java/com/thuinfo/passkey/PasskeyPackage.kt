package com.thuinfo.passkey

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class PasskeyPackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        if (name == PasskeyModule.NAME) PasskeyModule(reactContext) else null

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(PasskeyModule.NAME to ReactModuleInfo(
            PasskeyModule.NAME, PasskeyModule::class.java.name, false, false, false, true,
        ))
    }
}
