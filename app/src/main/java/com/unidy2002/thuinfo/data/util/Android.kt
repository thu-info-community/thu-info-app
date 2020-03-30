package com.unidy2002.thuinfo.data.util

import android.content.Context


fun getVersionCode(context: Context) = context.packageManager.getPackageInfo(context.packageName, 0).versionCode
