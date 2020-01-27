package com.unidy2002.thuinfo.data.model

import com.unidy2002.thuinfo.data.model.news.NewsContainer

data class LoggedInUser(val userId: String, val password: String) {
    var rememberPassword = false
    var displayName = ""
    lateinit var vpnTicket: String
    lateinit var personalCalendar: PersonalCalendar
    lateinit var communityTicket: String
    var dormitory = ""

    fun calenderInitialized() = ::personalCalendar.isInitialized

    lateinit var newsContainer: NewsContainer

    val connectionState = mutableMapOf(792 to false, 824 to false, -1 to false)
}
