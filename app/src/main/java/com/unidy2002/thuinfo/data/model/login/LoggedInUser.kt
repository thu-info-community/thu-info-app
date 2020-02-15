package com.unidy2002.thuinfo.data.model.login

import com.sun.mail.imap.IMAPStore
import com.unidy2002.thuinfo.data.model.schedule.Schedule
import java.util.*

data class LoggedInUser(val userId: String, val password: String) {
    var rememberPassword = false
    var fullName = ""
    lateinit var vpnTicket: String
    lateinit var schedule: Schedule
    lateinit var userName: String
    lateinit var emailAddress: String
    lateinit var imapStore: IMAPStore
    lateinit var communityPassword: String
    var communityLoggedIn = false

    fun scheduleInitialized() = ::schedule.isInitialized
    fun userNameInitialized() = ::userName.isInitialized
    fun emailAddressInitialized() = ::emailAddress.isInitialized
    fun imapStoreInitialized() = ::imapStore.isInitialized

    val connectionState = mutableMapOf(792 to false, 824 to false, -1 to false)

    val timerTasks = mutableListOf<TimerTask>()
}

private var _loggedInUser: LoggedInUser? = null

val loggedInUser: LoggedInUser get() = _loggedInUser ?: throw Exception("User not logged in!")

fun setUser(loggedInUser: LoggedInUser) {
    _loggedInUser = loggedInUser
}

fun revokeUser() {
    _loggedInUser = null
}