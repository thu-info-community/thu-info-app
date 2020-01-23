package com.unidy2002.thuinfo.data.model

import com.unidy2002.thuinfo.data.model.news.NewsContainer

data class LoggedInUser(val userId: String, val password: String) {
    var rememberPassword = false
    lateinit var displayName: String
    lateinit var vpnTicket: String
    lateinit var personalCalendar: PersonalCalendar

    fun calenderInitialized(): Boolean {
        return this::personalCalendar.isInitialized
    }

    var newsContainer = NewsContainer()

    val connectionState = mutableMapOf(792 to false, 824 to false)
}
