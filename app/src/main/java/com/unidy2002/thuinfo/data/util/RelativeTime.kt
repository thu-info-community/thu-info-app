package com.unidy2002.thuinfo.data.util

import java.lang.System.currentTimeMillis
import java.text.SimpleDateFormat
import java.util.*

/**
 * https://www.cnblogs.com/javaahb/p/12837017.html
 */
fun dateToRelativeTime(time: Long): String? {
    val second = currentTimeMillis() / 1000 - time
    return when (val day = second / (24 * 3600)) {
        0L -> {
            val hour = second % (24 * 3600) / 3600
            if (hour > 0) {
                "${hour}小时前"
            } else {
                val minute = second % 3600 / 60
                if (minute > 0) "${minute}分钟前" else "${second}秒前"
            }
        }
        in 1..29 -> "${day}天前"
        else -> SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).format(time)
    }
}
