package com.unidy2002.thuinfo.data.util

import android.os.Handler
import kotlin.concurrent.thread

fun safeThread(block: () -> Unit) = thread {
    try {
        block()
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

fun Handler.safePost(block: () -> Unit) = try {
    post(block)
} catch (e: Exception) {
    e.printStackTrace()
}