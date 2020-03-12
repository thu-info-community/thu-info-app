package com.unidy2002.thuinfo.data.util

import kotlin.concurrent.thread

fun safeThread(block: () -> Unit) = thread {
    try {
        block()
    } catch (e: Exception) {
        e.printStackTrace()
    }
}