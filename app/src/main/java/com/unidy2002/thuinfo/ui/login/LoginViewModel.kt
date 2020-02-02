package com.unidy2002.thuinfo.ui.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.LoginRepository
import com.unidy2002.thuinfo.data.model.general.Result
import com.unidy2002.thuinfo.data.util.Network
import java.lang.NullPointerException

class LoginViewModel(private var loginRepository: LoginRepository) : ViewModel() {

    private val _loginForm = MutableLiveData<LoginFormState>()
    val loginFormState: LiveData<LoginFormState> = _loginForm

    private val _loginResult = MutableLiveData<LoginResult>()
    val loginResult: LiveData<LoginResult> = _loginResult

    fun login(username: String, password: String) {
        val result = loginRepository.login(username, password)
        _loginResult.postValue(
            when {
                result is Result.Success ->
                    LoginResult(success = result.data)
                (result as Result.Error).exception is Network.UserLoginError ->
                    LoginResult(error = R.string.login_error)
                else ->
                    LoginResult(error = R.string.login_failed)
            }
        )
    }

    fun loginDataChanged(username: String, password: String) {
        if (!isUserNameValid(username)) {
            _loginForm.value = LoginFormState(usernameError = R.string.invalid_username)
        } else if (!isPasswordValid(password)) {
            _loginForm.value = LoginFormState(passwordError = R.string.invalid_password)
        } else {
            _loginForm.value = LoginFormState(isDataValid = true)
        }
    }

    fun getLoggedInUser() =
        if (loginRepository.isLoggedIn)
            loginRepository.loggedInUser!!
        else
            throw NullPointerException("User not logged in!")

    private fun isUserNameValid(username: String): Boolean {
        return username.matches(Regex("[0-9]+"))
    }

    private fun isPasswordValid(password: String): Boolean {
        return password.isNotBlank()
    }

    fun logout() {
        loginRepository.logout()
    }
}
