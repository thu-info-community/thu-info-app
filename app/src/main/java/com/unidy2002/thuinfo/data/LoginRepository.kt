package com.unidy2002.thuinfo.data

import com.unidy2002.thuinfo.data.model.LoggedInUser

/**
 * Class that requests authentication and user information from the remote data source and
 * maintains an in-memory cache of login status and user credentials information.
 */

class LoginRepository(val dataSource: LoginDataSource) {

    // in-memory cache of the loggedInUser object
    var loggedInUser: LoggedInUser? = null
        private set

    val isLoggedIn: Boolean
        get() = loggedInUser != null

    init {
        // If user credentials will be cached in local storage, it is recommended it be encrypted
        // @see https://developer.android.com/training/articles/keystore
        loggedInUser = null
    }

    fun logout() {
        loggedInUser?.timerTasks?.forEach { it.cancel() }
        loggedInUser = null
    }

    fun login(username: String, password: String): Result<LoggedInUser> =
        dataSource.login(username, password).also {
            if (it is Result.Success)
                setLoggedInUser(it.data)
        }

    private fun setLoggedInUser(loggedInUser: LoggedInUser) {
        this.loggedInUser = loggedInUser
        // If user credentials will be cached in local storage, it is recommended it be encrypted
        // @see https://developer.android.com/training/articles/keystore
    }
}
