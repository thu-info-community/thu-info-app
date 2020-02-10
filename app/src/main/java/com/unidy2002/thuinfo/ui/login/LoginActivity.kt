package com.unidy2002.thuinfo.ui.login

import android.Manifest.permission.READ_EXTERNAL_STORAGE
import android.Manifest.permission.WRITE_EXTERNAL_STORAGE
import android.animation.Animator
import android.animation.ObjectAnimator
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager.PERMISSION_GRANTED
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View.GONE
import android.view.View.VISIBLE
import android.view.inputmethod.EditorInfo
import android.widget.*
import androidx.annotation.StringRes
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
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
                login.isEnabled = isDataValid && loading.visibility != VISIBLE
                usernameError?.run { username.error = getString(this) }
                passwordError?.run { password.error = getString(this) }
            }
        })
        loginViewModel.loginResult.observe(this, Observer {
            it?.run {
                if (!inReportState) {
                    loading.visibility = GONE
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

        getSharedPreferences("config", MODE_PRIVATE).run {
            if (getBoolean("first_install", true)) {
                val titleFirstArray = resources.getStringArray(R.array.slide_title_first_string)
                val titleSecondArray = resources.getStringArray(R.array.slide_title_second_string)
                val mainTextArray = resources.getStringArray(R.array.slide_main_text_string)

                val loginSlideShow = findViewById<ConstraintLayout>(R.id.login_slide_show)
                val slideTitleFirst = findViewById<TextView>(R.id.slide_title_first)
                val slideTitleSecond = findViewById<TextView>(R.id.slide_title_second)
                val slideMainText = findViewById<TextView>(R.id.slide_main_text)
                val slideNext = findViewById<TextView>(R.id.slide_next)

                fun fadeIn(target: TextView, duration: Long, startDelay: Long, text: String) {
                    ObjectAnimator.ofFloat(target, "alpha", 0f, 1f).run {
                        this.duration = duration
                        this.startDelay = startDelay
                        addListener(object : Animator.AnimatorListener {
                            override fun onAnimationStart(animation: Animator) {
                                target.visibility = VISIBLE
                                target.text = text
                            }

                            override fun onAnimationEnd(animation: Animator) {}

                            override fun onAnimationCancel(animation: Animator) {}

                            override fun onAnimationRepeat(animation: Animator) {}
                        })
                        start()
                    }
                }

                fun fadeOut(target: TextView, duration: Long, startDelay: Long) {
                    ObjectAnimator.ofFloat(target, "alpha", 1f, 0f).run {
                        this.duration = duration
                        this.startDelay = startDelay
                        addListener(object : Animator.AnimatorListener {
                            override fun onAnimationStart(animation: Animator) {}

                            override fun onAnimationEnd(animation: Animator) {
                                target.visibility = GONE
                            }

                            override fun onAnimationCancel(animation: Animator) {}

                            override fun onAnimationRepeat(animation: Animator) {}
                        })
                        start()
                    }
                }

                fun updateSlide() {
                    if (currentSlide == slideCount) {
                        loginSlideShow.visibility = GONE
                        edit().putBoolean("first_install", false).apply()
                        if (checkSelfPermission(WRITE_EXTERNAL_STORAGE) != PERMISSION_GRANTED ||
                            checkSelfPermission(READ_EXTERNAL_STORAGE) != PERMISSION_GRANTED
                        ) {
                            AlertDialog.Builder(this@LoginActivity)
                                .setTitle(R.string.request_permission_title)
                                .setMessage(R.string.request_permission_message)
                                .setPositiveButton(R.string.request_permission_ok) { _, _ -> }
                                .setOnDismissListener {
                                    requestPermissions(arrayOf(WRITE_EXTERNAL_STORAGE, READ_EXTERNAL_STORAGE), 1)
                                }
                                .show()
                        }
                    } else {
                        fadeOut(slideTitleFirst, 600, 100)
                        fadeOut(slideTitleSecond, 600, 100)
                        fadeOut(slideMainText, 600, 100)
                        fadeOut(slideNext, 600, 100)

                        fadeIn(slideTitleFirst, 750, 1000, titleFirstArray[currentSlide])
                        fadeIn(slideTitleSecond, 750, 2200, titleSecondArray[currentSlide])
                        fadeIn(slideMainText, 750, 3400, mainTextArray[currentSlide])
                        fadeIn(
                            slideNext, 700, 3200, resources.getString(
                                if (currentSlide < slideCount - 1) R.string.next_step_string else R.string.finish_string
                            )
                        )
                    }
                }

                loginSlideShow.visibility = VISIBLE
                currentSlide = 0
                updateSlide()

                findViewById<TextView>(R.id.slide_next).setOnClickListener {
                    currentSlide++
                    updateSlide()
                }
            }

            if (!getBoolean("sent_api", false)) {
                try {  // In an attempt to find the proper min sdk
                    AVOSCloud.initialize(this@LoginActivity, appId, appKey, serverURL)
                    AVObject("API_COUNT").run {
                        put("api", android.os.Build.VERSION.SDK_INT)
                        saveInBackground().subscribe(object : io.reactivex.Observer<AVObject> {
                            override fun onComplete() {
                                edit().putBoolean("sent_api", true).apply()
                            }

                            override fun onSubscribe(d: Disposable) {}
                            override fun onNext(t: AVObject) {}
                            override fun onError(e: Throwable) {
                                e.printStackTrace()
                            }
                        })
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        findViewById<TextView>(R.id.login_to_report).setOnClickListener {
            try {
                loginThread?.interrupt()
            } catch (e: Exception) {
                e.printStackTrace()
            }
            inReportState = true
            loading.visibility = GONE
            username.isEnabled = true
            password.isEnabled = true
            login.isEnabled = true
            remember.isEnabled = true
            AlertDialog.Builder(this)
                .setTitle(R.string.report_guide_text)
                .setView(R.layout.report_guide)
                .setPositiveButton(R.string.report_guide_quick) { _, _ ->
                    startActivity(Intent().apply { setClass(this@LoginActivity, ReportActivity::class.java) })
                }
                .setOnCancelListener { inReportState = false }
                .show()
        }
    }

    private fun doLogin() {
        val username = findViewById<EditText>(R.id.username)
        val password = findViewById<EditText>(R.id.password)
        findViewById<ProgressBar>(R.id.loading).visibility = VISIBLE
        findViewById<Button>(R.id.login).isEnabled = false
        findViewById<CheckBox>(R.id.remember).isEnabled = false
        username.isEnabled = false
        password.isEnabled = false
        loginThread = thread {
            try {
                loginViewModel.login(username.text.toString(), password.text.toString())
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
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

    override fun onResume() {
        inReportState = false
        super.onResume()
    }

    private var loginThread: Thread? = null
    private var inReportState = false

    private var currentSlide = 0
    private val slideCount = 3

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