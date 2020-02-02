package com.unidy2002.thuinfo.data.model.login

import com.unidy2002.thuinfo.data.model.general.Result
import com.unidy2002.thuinfo.data.util.Network

/**
 * Class that handles authentication w/ login credentials and retrieves user information.
 */
class LoginDataSource {

    fun login(username: String, password: String): Result<LoggedInUser> {
        return try {
            val loggedInUser = LoggedInUser(username, password)
            Network().login(loggedInUser)
            Result.Success(loggedInUser)
        } catch (e: Network.UserLoginError) {
            Result.Error(e)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.Error(Exception("Error logging in", e))
        }
    }

    fun logout() {
        try {
            Network().logout()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
