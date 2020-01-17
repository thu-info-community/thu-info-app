package com.unidy2002.thuinfo.ui.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.LoginRepository
import com.unidy2002.thuinfo.data.Result
import java.lang.NullPointerException

class LoginViewModel(private var loginRepository: LoginRepository) : ViewModel() {

    private val _loginForm = MutableLiveData<LoginFormState>()
    val loginFormState: LiveData<LoginFormState> = _loginForm

    private val _loginResult = MutableLiveData<LoginResult>()
    val loginResult: LiveData<LoginResult> = _loginResult

    fun login(username: String, password: String) {

        Thread(Runnable {
            val result = loginRepository.login(username, password)

            _loginResult.postValue(
                if (result is Result.Success) {
                    LoginResult(success = result.data)
                } else {
                    LoginResult(error = R.string.login_failed)
                }
            )
        }).start()

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
}
