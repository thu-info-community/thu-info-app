package com.unidy2002.thuinfo

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class AlipayPackage : ReactPackage {
    override fun createViewManagers(reactContext: ReactApplicationContext) = emptyList<ViewManager<*, *>>()

    override fun createNativeModules(reactContext: ReactApplicationContext) = listOf(Alipay(reactContext))
}