package com.unidy2002.thuinfo.ui.login

import android.app.Activity
import android.app.AlertDialog
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
import androidx.lifecycle.ViewModelProvider
import cn.leancloud.AVOSCloud
import cn.leancloud.AVObject
import com.unidy2002.thuinfo.MainActivity
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.LoggedInUser
import com.unidy2002.thuinfo.data.util.*
import com.unidy2002.thuinfo.ui.report.ReportActivity
import io.reactivex.disposables.Disposable
import kotlin.concurrent.thread

class LoginActivity : AppCompatActivity() {

    companion object {
        lateinit var loginViewModel: LoginViewModel
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_login)

        val username = findViewById<EditText>(R.id.username)
        val password = findViewById<EditText>(R.id.password)
        val remember = findViewById<CheckBox>(R.id.remember)
        val login = findViewById<Button>(R.id.login)
        val loading = findViewById<ProgressBar>(R.id.loading)

        loginViewModel = ViewModelProvider(this, LoginViewModelFactory())
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
                if (actionId == EditorInfo.IME_ACTION_DONE) doLogin()
                false
            }

            login.setOnClickListener { doLogin() }
        }

        try {
            getSharedPreferences("UserId", MODE_PRIVATE).run {
                if (getString("remember", "") == "true") {
                    username.setText(getString("username", ""))
                    password.setText(
                        decrypt(
                            username.text.toString(),
                            getString("iv", "")!! to getString("data", "")!!
                        )
                    )
                    remember.isChecked = true
                    login.callOnClick()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        try { // In order to find the appropriate min sdk
            getSharedPreferences("config", MODE_PRIVATE).run {
                if (getBoolean("first_install", true)) {
                    AVOSCloud.initialize(this@LoginActivity, appId, appKey, serverURL)
                    AVObject("API_COUNT").run {
                        put("api", android.os.Build.VERSION.SDK_INT)
                        saveInBackground().subscribe(object : io.reactivex.Observer<AVObject> {
                            override fun onComplete() {
                                try {
                                    edit().putBoolean("first_install", false).apply()
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                }
                            }

                            override fun onSubscribe(d: Disposable) {}
                            override fun onNext(t: AVObject) {}

                            override fun onError(e: Throwable) {
                                e.printStackTrace()
                            }
                        })
                    }

                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        findViewById<TextView>(R.id.login_to_report).setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle(R.string.report_guide_text)
                .setView(R.layout.report_guide)
                .setPositiveButton(R.string.report_guide_quick) { _, _ ->
                    startActivity(Intent().apply { setClass(this@LoginActivity, ReportActivity::class.java) })
                }
                .show()
        }
    }

    private fun doLogin() {
        val username = findViewById<EditText>(R.id.username)
        val password = findViewById<EditText>(R.id.password)
        findViewById<ProgressBar>(R.id.loading).visibility = View.VISIBLE
        findViewById<Button>(R.id.login).isEnabled = false
        findViewById<CheckBox>(R.id.remember).isEnabled = false
        username.isEnabled = false
        password.isEnabled = false
        thread { loginViewModel.login(username.text.toString(), password.text.toString()) }
    }

    private fun updateUiWithUser(model: LoggedInUser) {
        val remember = findViewById<CheckBox>(R.id.remember)
        val username = findViewById<EditText>(R.id.username)
        val password = findViewById<EditText>(R.id.password)
        if (remember.isChecked) {
            getSharedPreferences("UserId", MODE_PRIVATE).edit().run {
                putString("remember", "true")
                putString("username", username.text.toString())
                encrypt(username.text.toString(), password.text.toString()).run {
                    putString("iv", first)
                    putString("data", second)
                }
                apply()
            }
        } else {
            getSharedPreferences("UserId", MODE_PRIVATE).edit().clear().apply()
        }

        getSharedPreferences(loginViewModel.getLoggedInUser().userId, MODE_PRIVATE).run {
            getString("username", null)?.run { loginViewModel.getLoggedInUser().userName = this }
            getString("email", null)?.run { loginViewModel.getLoggedInUser().emailAddress = this }
        }

        val intent = Intent()
        intent.setClass(this, MainActivity::class.java)
        startActivity(intent)

        model.rememberPassword = findViewById<CheckBox>(R.id.remember).isChecked
    }

    private fun showLoginFailed(@StringRes errorString: Int) {
        Toast.makeText(applicationContext, errorString, Toast.LENGTH_SHORT).show()
    }

    private fun EditText.afterTextChanged(afterTextChanged: (String) -> Unit) {
        this.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(editable: Editable?) {
                afterTextChanged.invoke(editable.toString())
            }

            override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {}
        })
    }
}