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
import com.unidy2002.thuinfo.data.model.login.LoggedInUser
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

        loginViewModel = ViewModelProvider(this, LoginViewModelFactory()).get(LoginViewModel::class.java)
        loginViewModel.loginFormState.observe(this, Observer {
            it?.run {
                login.isEnabled = isDataValid && loading.visibility != View.VISIBLE
                usernameError?.run { username.error = getString(this) }
                passwordError?.run { password.error = getString(this) }
            }
        })
        loginViewModel.loginResult.observe(this, Observer {
            it?.run {
                loading.visibility = View.GONE
                if (error != null) {
                    showLoginFailed(error)
                    username.isEnabled = true
                    password.isEnabled = true
                    login.isEnabled = true
                    remember.isEnabled = true
                } else if (success != null) {
                    updateData(success)
                    setResult(Activity.RESULT_OK)
                    startActivity(Intent().apply { setClass(this@LoginActivity, MainActivity::class.java) })
                    finish()
                }
            }
        })

        username.afterTextChanged {
            loginViewModel.loginDataChanged(username.text.toString(), password.text.toString())
        }

        password.apply {
            afterTextChanged { loginViewModel.loginDataChanged(username.text.toString(), password.text.toString()) }
            setOnEditorActionListener { _, actionId, _ ->
                if (actionId == EditorInfo.IME_ACTION_DONE) doLogin()
                false
            }
        }

        login.setOnClickListener { doLogin() }

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

        try { // In order to find the proper min sdk
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

    private fun updateData(model: LoggedInUser) {
        with(findViewById<CheckBox>(R.id.remember).isChecked) {
            model.rememberPassword = this
            if (this) {
                getSharedPreferences("UserId", MODE_PRIVATE).edit().run {
                    putString("remember", "true")
                    putString("username", model.userId)
                    encrypt(model.userId, model.password).run {
                        putString("iv", first)
                        putString("data", second)
                    }
                    apply()
                }
            } else {
                getSharedPreferences("UserId", MODE_PRIVATE).edit().clear().apply()
            }
        }

        getSharedPreferences(loginViewModel.getLoggedInUser().userId, MODE_PRIVATE).run {
            getString("username", null)?.run { model.userName = this }
            getString("email", null)?.run { model.emailAddress = this }
        }
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