package com.unidy2002.thuinfo.ui.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.LoggedInUser
import com.unidy2002.thuinfo.data.model.login.setUser
import com.unidy2002.thuinfo.data.network.Network


class LoginViewModel : ViewModel() {

    private val _loginForm = MutableLiveData<LoginFormState>()
    val loginFormState: LiveData<LoginFormState> = _loginForm

    private val _loginResult = MutableLiveData<LoginResult>()
    val loginResult: LiveData<LoginResult> = _loginResult

    fun login(username: String, password: String) {
        _loginResult.postValue(
            try {
                LoginResult(success = Network.login(username, password).also { setUser(it) })
            } catch (e: Network.UserLoginError) {
                LoginResult(error = R.string.login_error)
            } catch (e: Exception) {
                e.printStackTrace()
                LoginResult(error = R.string.login_failed)
            }
        )
    }

    fun loginDataChanged(username: String, password: String) {
        if (!isUsernameValid(username)) {
            _loginForm.value = LoginFormState(usernameError = R.string.invalid_username)
        } else if (!isPasswordValid(password)) {
            _loginForm.value = LoginFormState(passwordError = R.string.invalid_password)
        } else {
            _loginForm.value = LoginFormState(isDataValid = true)
        }
    }

    private fun isUsernameValid(username: String) = username.matches(Regex("[0-9]+"))

    private fun isPasswordValid(password: String) = password.isNotEmpty()

    data class LoginFormState(
        val usernameError: Int? = null,
        val passwordError: Int? = null,
        val isDataValid: Boolean = false
    )

    data class LoginResult(
        val success: LoggedInUser? = null,
        val error: Int? = null
    )
}
