package com.unidy2002.thuinfo.ui.login

import com.unidy2002.thuinfo.data.model.LoggedInUser

/**
 * Authentication result : success (user details) or error message.
 */
data class LoginResult(
    val success: LoggedInUser? = null,
    val error: Int? = null
)
