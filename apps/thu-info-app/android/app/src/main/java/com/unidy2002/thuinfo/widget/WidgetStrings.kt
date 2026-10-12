package com.unidy2002.thuinfo.widget

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

// The cards speak the app's language, not the launcher's: the snapshot carries
// the resolved in-app language (scheduleWidget.ts resolveLanguage()) and the
// renderers resolve string resources through a matching configuration context,
// so a zh app on an en-US launcher never renders mixed text.
object WidgetStrings {
    fun context(context: Context, snapshot: WidgetSnapshot?): Context {
        val locale = when (snapshot?.language) {
            "zh" -> Locale.SIMPLIFIED_CHINESE
            "en" -> Locale.ENGLISH
            else -> return context
        }
        val config = Configuration(context.resources.configuration)
        config.setLocale(locale)
        return context.createConfigurationContext(config)
    }
}
