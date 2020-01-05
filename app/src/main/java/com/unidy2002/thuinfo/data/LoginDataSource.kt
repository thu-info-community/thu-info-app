package com.unidy2002.thuinfo.data

import com.unidy2002.thuinfo.data.model.LoggedInUser
import java.io.IOException
import com.unidy2002.thuinfo.data.lib.GetInfo

/**
 * Class that handles authentication w/ login credentials and retrieves user information.
 */
class LoginDataSource {

    fun login(username: String, password: String): Result<LoggedInUser> {
        return try {
            val loggedInUser = LoggedInUser(username)
            GetInfo.login(loggedInUser, password)
            Result.Success(loggedInUser)
        } catch (e: Throwable) {
            Result.Error(IOException("Error logging in", e))
        }
    }

    fun logout() {
        // TODO: revoke authentication
    }
}
