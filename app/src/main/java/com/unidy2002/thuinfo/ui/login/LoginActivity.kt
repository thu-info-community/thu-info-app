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
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import com.unidy2002.thuinfo.MainActivity
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.LoggedInUser
import com.unidy2002.thuinfo.data.util.decrypt
import com.unidy2002.thuinfo.data.util.encrypt
import com.unidy2002.thuinfo.ui.report.ReportActivity
import kotlin.concurrent.thread


class LoginActivity : AppCompatActivity() {

    private lateinit var loginViewModel: LoginViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        loginViewModel = ViewModelProvider(this).get(LoginViewModel::class.java)

        val username = findViewById<EditText>(R.id.username)
        val password = findViewById<EditText>(R.id.password)
        val remember = findViewById<CheckBox>(R.id.remember)
        val login = findViewById<Button>(R.id.login)
        val loading = findViewById<ProgressBar>(R.id.loading)

        // Observe login form change
        loginViewModel.loginFormState.observe(this, Observer {
            it?.run {
                login.isEnabled = isDataValid && loading.visibility != VISIBLE
                usernameError?.run { username.error = getString(this) }
                passwordError?.run { password.error = getString(this) }
            }
        })

        // Observe login result change
        loginViewModel.loginResult.observe(this, Observer {
            it?.takeIf { !inReportState }?.run {
                loading.visibility = GONE
                if (error != null) {
                    Toast.makeText(applicationContext, error, Toast.LENGTH_SHORT).show()
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

        // Inform that the login form has changed (for validity check)
        username.afterTextChanged {
            loginViewModel.loginDataChanged(username.text.toString(), password.text.toString())
        }

        password.afterTextChanged {
            loginViewModel.loginDataChanged(username.text.toString(), password.text.toString())
        }

        password.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) doLogin()
            false
        }

        login.setOnClickListener { doLogin() }

        // Try to get remembered password
        getSharedPreferences("UserId", MODE_PRIVATE)?.run {
            val id = getString("username", "")
            if (!id.isNullOrBlank()) username.setText(id)
            try {
                if (getString("remember", "") == "true") {
                    password.setText(
                        decrypt(
                            username.text.toString(),
                            getString("iv", "")!! to getString("data", "")!!
                        )
                    )
                    remember.isChecked = true
                    doLogin()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // First-install operations
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
                                .setCancelable(false)
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
        }

        // Set report button listener
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
                Toast.makeText(applicationContext, R.string.login_exception, Toast.LENGTH_SHORT).show()
                e.printStackTrace()
            }
        }
    }

    private fun updateData(loggedInUser: LoggedInUser) {
        with(loggedInUser) {
            // Save remembered password
            rememberPassword = findViewById<CheckBox>(R.id.remember).isChecked
            getSharedPreferences("UserId", MODE_PRIVATE).edit().run {
                putString("username", userId)
                if (rememberPassword) {
                    putString("remember", "true")
                    encrypt(userId, password).run {
                        putString("iv", first)
                        putString("data", second)
                    }
                } else {
                    putString("remember", "false")
                    remove("iv")
                    remove("data")
                }
                apply()
            }

            // Try to get username and email
            getSharedPreferences(userId, MODE_PRIVATE).run {
                getString("username", null)?.run { userName = this }
                getString("email", null)?.run { emailAddress = this }
            }

            // Try to get community password
            communityPassword = try {
                getSharedPreferences(loggedInUser.userId, MODE_PRIVATE).run {
                    val civ = getString("civ", null)  // Community initial vector
                    val cpe = getString("cpe", null)  // Community password encrypted
                    if (civ != null && cpe != null) {
                        decrypt("c${loggedInUser.userId}", civ to cpe)
                    } else {
                        password
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                password
            }

            // Try to get hole token
            holeToken = try {
                getSharedPreferences(loggedInUser.userId, MODE_PRIVATE).run {
                    val hiv = getString("hiv", null)  // Hole initial vector
                    val hpe = getString("hpe", null)  // Hole password encrypted
                    if (hiv != null && hpe != null) {
                        decrypt("h${loggedInUser.userId}", hiv to hpe)
                    } else {
                        ""
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                ""
            }
        }
    }

    // In case the user returns from report
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