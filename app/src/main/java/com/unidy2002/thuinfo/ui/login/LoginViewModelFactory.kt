package com.unidy2002.thuinfo.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.unidy2002.thuinfo.data.model.login.LoginDataSource
import com.unidy2002.thuinfo.data.model.login.LoginRepository

/**
 * ViewModel provider factory to instantiate LoginViewModel.
 * Required given LoginViewModel has a non-empty constructor
 */
class LoginViewModelFactory : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(LoginViewModel::class.java)) {
            return LoginViewModel(LoginRepository(LoginDataSource())) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
