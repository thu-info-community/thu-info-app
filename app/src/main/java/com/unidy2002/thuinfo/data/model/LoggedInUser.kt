package com.unidy2002.thuinfo.data.model

import com.unidy2002.thuinfo.data.model.news.NewsContainer

data class LoggedInUser(val userId: String, val password: String) {
    var rememberPassword = false
    var fullName = ""
    lateinit var vpnTicket: String
    lateinit var personalCalendar: PersonalCalendar
    lateinit var communityTicket: String
    var dormitory = ""
    lateinit var userName: String
    lateinit var emailAddress: String

    fun calenderInitialized() = ::personalCalendar.isInitialized
    fun userNameInitialized() = ::userName.isInitialized
    fun emailAddressInitialized() = ::emailAddress.isInitialized

    lateinit var newsContainer: NewsContainer

    val connectionState = mutableMapOf(792 to false, 824 to false, -1 to false)
}
