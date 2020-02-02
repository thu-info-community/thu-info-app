package com.unidy2002.thuinfo.ui.login

import com.unidy2002.thuinfo.data.model.login.LoggedInUser

data class LoginResult(
    val success: LoggedInUser? = null,
    val error: Int? = null
)
