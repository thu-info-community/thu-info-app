package com.unidy2002.thuinfo.data.model

data class LoggedInUser(val userId: String) {
    lateinit var displayName: String
    lateinit var loginCookie: String
    lateinit var zhjwSessionId: String
    lateinit var eCardTicket: String
    lateinit var calenderTicket: String
    lateinit var calender: Calender
    lateinit var eCardCookie: String
    lateinit var eCardTable: EcardTable

    fun calenderInitialized(): Boolean {
        return this::calender.isInitialized
    }

    fun eCardInitialized(): Boolean {
        return this::eCardTable.isInitialized
    }
}
