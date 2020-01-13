package com.unidy2002.thuinfo.ui.login

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.*
import androidx.annotation.StringRes
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProviders
import com.unidy2002.thuinfo.MainActivity
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.LoggedInUser
import com.unidy2002.thuinfo.userModel

class LoginActivity : AppCompatActivity() {

    private lateinit var loginViewModel: LoginViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_login)

        val username = findViewById<EditText>(R.id.username)
        val password = findViewById<EditText>(R.id.password)
        val remember = findViewById<CheckBox>(R.id.remember)
        val login = findViewById<Button>(R.id.login)
        val loading = findViewById<ProgressBar>(R.id.loading)

        loginViewModel = ViewModelProviders.of(this, LoginViewModelFactory())
            .get(LoginViewModel::class.java)

        loginViewModel.loginFormState.observe(this@LoginActivity, Observer {
            val loginState = it ?: return@Observer

            login.isEnabled = loginState.isDataValid && loading.visibility != View.VISIBLE

            if (loginState.usernameError != null) {
                username.error = getString(loginState.usernameError)
            }
            if (loginState.passwordError != null) {
                password.error = getString(loginState.passwordError)
            }
        })

        loginViewModel.loginResult.observe(this@LoginActivity, Observer {
            val loginResult = it ?: return@Observer

            loading.visibility = View.GONE
            if (loginResult.error != null) {
                showLoginFailed(loginResult.error)
                username.isEnabled = true
                password.isEnabled = true
                login.isEnabled = true
                remember.isEnabled = true
            } else if (loginResult.success != null) {
                updateUiWithUser(loginResult.success)
                userModel = loginResult.success
                setResult(Activity.RESULT_OK)
                finish()
            }
        })

        username.afterTextChanged {
            loginViewModel.loginDataChanged(
                username.text.toString(),
                password.text.toString()
            )
        }

        password.apply {
            afterTextChanged {
                loginViewModel.loginDataChanged(
                    username.text.toString(),
                    password.text.toString()
                )
            }

            setOnEditorActionListener { _, actionId, _ ->
                when (actionId) {
                    EditorInfo.IME_ACTION_DONE -> {
                        loading.visibility = View.VISIBLE
                        username.isEnabled = false
                        password.isEnabled = false
                        login.isEnabled = false
                        remember.isEnabled = false
                        loginViewModel.login(username.text.toString(), password.text.toString())
                    }
                }
                false
            }

            login.setOnClickListener {
                loading.visibility = View.VISIBLE
                username.isEnabled = false
                password.isEnabled = false
                login.isEnabled = false
                remember.isEnabled = false
                loginViewModel.login(username.text.toString(), password.text.toString())
            }
        }

        val sharedPreferences = getSharedPreferences("UserId", MODE_PRIVATE)
        if (sharedPreferences.getString("remember", "") == "true") {
            username.setText(sharedPreferences.getString("username", ""))
            password.setText(sharedPreferences.getString("password", ""))
            remember.isChecked = true
            login.callOnClick()
        }
    }

    private fun updateUiWithUser(model: LoggedInUser) {
        val welcome = getString(R.string.welcome)
        val displayName = model.displayName

        val remember = findViewById<CheckBox>(R.id.remember)
        if (remember.isChecked) {
            val username = findViewById<EditText>(R.id.username)
            val password = findViewById<EditText>(R.id.password)
            val sharedPreferences = getSharedPreferences("UserId", MODE_PRIVATE).edit()
            sharedPreferences.putString("remember", "true")
            sharedPreferences.putString("username", username.text.toString())
            sharedPreferences.putString("password", password.text.toString())
            sharedPreferences.apply()
        } else {
            getSharedPreferences("UserId", MODE_PRIVATE).edit().clear().apply()
        }

        val intent = Intent()
        intent.setClass(this, MainActivity::class.java)
        startActivity(intent)

        Toast.makeText(
            applicationContext,
            "$welcome $displayName",
            Toast.LENGTH_LONG
        ).show()
    }

    private fun showLoginFailed(@StringRes errorString: Int) {
        Toast.makeText(applicationContext, errorString, Toast.LENGTH_SHORT).show()
    }
}

/**
 * Extension function to simplify setting an afterTextChanged action to EditText components.
 */
fun EditText.afterTextChanged(afterTextChanged: (String) -> Unit) {
    this.addTextChangedListener(object : TextWatcher {
        override fun afterTextChanged(editable: Editable?) {
            afterTextChanged.invoke(editable.toString())
        }

        override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}

        override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {}
    })
}