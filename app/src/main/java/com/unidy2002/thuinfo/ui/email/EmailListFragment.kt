package com.unidy2002.thuinfo.ui.email

import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.connectImap
import com.unidy2002.thuinfo.data.lib.getEmailList
import com.unidy2002.thuinfo.ui.login.LoginActivity
import kotlin.concurrent.thread

class EmailListFragment : Fragment() {

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_email_list, container, false)

    class EmailConfigurationLayout(context: Context) : LinearLayout(context) {
        val name: EditText
        val host: Spinner

        init {
            (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
                .inflate(R.layout.email_configuration, this, true)
                .run {
                    name = findViewById(R.id.username_config)
                    host = findViewById(R.id.host_list)
                    host.adapter = ArrayAdapter<String>(
                        context, android.R.layout.simple_spinner_dropdown_item,
                        listOf("@mails.tsinghua.edu.cn", "@mail.tsinghua.edu.cn")
                    )
                }
        }
    }

    private val handler = Handler()

    private val loggedInUser get() = LoginActivity.loginViewModel.getLoggedInUser()

    private fun updateUI() {
        thread(start = true) {
            try {
                val result = getEmailList((activity as EmailActivity).imapStore, "INBOX")
                handler.post {
                    AlertDialog.Builder(context!!)
                        .setTitle("收件箱")
                        .setMessage(result.joinToString("\n=================\n"))
                        .show()
                    view?.findViewById<ProgressBar>(R.id.config_loading)?.visibility = View.GONE
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun configure(virgin: Boolean = true) {
        if (loggedInUser.emailAddressInitialized()) {
            thread(start = true) {
                try {
                    (activity as EmailActivity).imapStore =
                        connectImap(loggedInUser.emailAddress, loggedInUser.password)
                    handler.post { updateUI() }
                } catch (e: Exception) {
                    e.printStackTrace()
                    handler.post { Toast.makeText(context, "登录异常，请重试", Toast.LENGTH_LONG).show() }
                }
            }
        } else {
            val input = EmailConfigurationLayout(context!!)
                .apply { if (loggedInUser.userNameInitialized()) name.setText(loggedInUser.userName) }
            AlertDialog.Builder(context!!)
                .setTitle(if (virgin) "配置您的邮箱" else "配置异常，请重试")
                .setView(input)
                .setPositiveButton("确认") { _, _ ->
                    thread(start = true) {
                        try {
                            val email = input.name.text.toString() + input.host.selectedItem.toString()
                            (activity as EmailActivity).imapStore = connectImap(email, loggedInUser.password)
                            handler.post {
                                updateUI()
                                activity?.getSharedPreferences(loggedInUser.userId, AppCompatActivity.MODE_PRIVATE)
                                    ?.edit()?.run {
                                        loggedInUser.emailAddress = email
                                            .also { putString("email", it) }
                                        if (!loggedInUser.userNameInitialized())
                                            loggedInUser.userName = input.name.text.toString()
                                                .also { putString("username", it) }
                                        apply()
                                    }
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                            handler.post { configure(false) }
                        }
                    }
                }
                .setNegativeButton("取消") { _, _ -> activity?.finish() }
                .setCancelable(false)
                .show()
        }
    }

    override fun onStart() {
        configure()
        super.onStart()
    }
}