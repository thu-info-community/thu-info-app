package com.unidy2002.thuinfo.data.model

import com.unidy2002.thuinfo.data.model.news.NewsContainer

data class LoggedInUser(val userId: String) {
    lateinit var displayName: String
    lateinit var vpnTicket: String
    lateinit var eCardTicket: String
    lateinit var personalCalendar: PersonalCalendar
    lateinit var eCardRecord: ECardRecord

    fun calenderInitialized(): Boolean {
        return this::personalCalendar.isInitialized
    }

    fun eCardInitialized(): Boolean {
        return this::eCardRecord.isInitialized
    }

    var newsContainer = NewsContainer()
}
