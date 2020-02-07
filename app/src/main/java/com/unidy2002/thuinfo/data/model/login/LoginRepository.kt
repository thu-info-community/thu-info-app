package com.unidy2002.thuinfo.data.model.login

import com.unidy2002.thuinfo.data.model.general.Result

/**
 * Class that requests authentication and user information from the remote data source and
 * maintains an in-memory cache of login status and user credentials information.
 */

class LoginRepository(private val dataSource: LoginDataSource) {

    // in-memory cache of the loggedInUser object
    var loggedInUser: LoggedInUser? = null
        private set

    val isLoggedIn: Boolean
        get() = loggedInUser != null

    init {
        loggedInUser = null
    }

    fun logout() {
        loggedInUser?.timerTasks?.forEach { it.cancel() }
        dataSource.logout()
        loggedInUser = null
    }

    fun login(username: String, password: String) =
        dataSource.login(username, password).also {
            if (it is Result.Success)
                setLoggedInUser(it.data)
        }

    private fun setLoggedInUser(loggedInUser: LoggedInUser) {
        this.loggedInUser = loggedInUser
    }
}
