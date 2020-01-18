package com.unidy2002.thuinfo.data.model

import com.unidy2002.thuinfo.data.model.news.NewsContainer

data class LoggedInUser(val userId: String) {
    lateinit var displayName: String
    lateinit var vpnTicket: String
    lateinit var eCardTicket: String
    lateinit var calendar: Calendar
    lateinit var eCardTable: EcardTable

    fun calenderInitialized(): Boolean {
        return this::calendar.isInitialized
    }

    fun eCardInitialized(): Boolean {
        return this::eCardTable.isInitialized
    }

    var newsContainer = NewsContainer()
}
