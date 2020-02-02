package com.unidy2002.thuinfo.ui.email

import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.view.LayoutInflater
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.fragment.app.FragmentPagerAdapter
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.viewpager.widget.ViewPager
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.util.connectImap
import com.unidy2002.thuinfo.ui.login.LoginActivity
import javax.mail.Message
import kotlin.concurrent.thread

class EmailActivity : AppCompatActivity() {

    val viewList = listOf(
        EmailListFragment().apply { arguments = Bundle().apply { putBoolean("inbox", true) } },
        EmailListFragment().apply { arguments = Bundle().apply { putBoolean("inbox", false) } },
        EmailWriteFragment()
    )

    private fun updateUI() {
        viewPager.adapter =
            object : FragmentPagerAdapter(supportFragmentManager, BEHAVIOR_RESUME_ONLY_CURRENT_FRAGMENT) {
                override fun getItem(position: Int) = viewList[position]
                override fun getCount() = 3
            }
        findViewById<TextView>(R.id.inbox_text).apply {
            isSelected = true
            isEnabled = true
        }
        findViewById<TextView>(R.id.sent_text).isEnabled = true
        findViewById<TextView>(R.id.write_text).isEnabled = true
        findViewById<ProgressBar>(R.id.config_loading).visibility = View.GONE
    }

    private fun configure(virgin: Boolean = true) {
        if (loggedInUser.emailAddressInitialized()) {
            findViewById<ProgressBar>(R.id.config_loading).visibility = View.VISIBLE
            thread {
                try {
                    connectImap(loggedInUser.emailAddress, loggedInUser.password)
                    handler.post { updateUI() }
                } catch (e: Exception) {
                    e.printStackTrace()
                    handler.post {
                        findViewById<ProgressBar>(R.id.config_loading).visibility = View.GONE
                        Toast.makeText(this, R.string.login_error_retry, Toast.LENGTH_LONG).show()
                    }
                }
            }
        } else {
            val input = EmailConfigurationLayout(this)
                .apply { if (loggedInUser.userNameInitialized()) name.setText(loggedInUser.userName) }
            AlertDialog.Builder(this)
                .setTitle(if (virgin) R.string.config_your_email else R.string.config_error_retry)
                .setView(input)
                .setPositiveButton(R.string.confirm_string) { _, _ ->
                    findViewById<ProgressBar>(R.id.config_loading).visibility = View.VISIBLE
                    thread {
                        try {
                            val email = input.name.text.toString() + input.host.selectedItem.toString()
                            connectImap(email, loggedInUser.password)
                            handler.post {
                                updateUI()
                                getSharedPreferences(loggedInUser.userId, MODE_PRIVATE).edit().run {
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
                            handler.post {
                                findViewById<ProgressBar>(R.id.config_loading).visibility = View.GONE
                                configure(false)
                            }
                        }
                    }
                }
                .setNegativeButton(R.string.cancel_string) { _, _ -> finish() }
                .setCancelable(false)
                .show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_email)
        setSupportActionBar(findViewById<Toolbar>(R.id.email_toolbar).apply {
            navigationIcon = resources.getDrawable(R.drawable.ic_clear_24dp, null)
            setNavigationOnClickListener { finish() }
        })

        val labelList =
            listOf<TextView>(findViewById(R.id.inbox_text), findViewById(R.id.sent_text), findViewById(R.id.write_text))

        viewPager = findViewById(R.id.email_view_pager)
        viewPager.addOnPageChangeListener(object : ViewPager.OnPageChangeListener {
            override fun onPageScrollStateChanged(state: Int) {}
            override fun onPageScrolled(position: Int, positionOffset: Float, positionOffsetPixels: Int) {}
            override fun onPageSelected(position: Int) {
                labelList[position].isSelected = true
                labelList.filterIndexed { id, _ -> id != position }.forEach { it.isSelected = false }
            }
        })

        labelList.forEachIndexed { index, textView ->
            textView.setOnClickListener {
                viewPager.setCurrentItem(index, true)
                textView.isSelected = true
                labelList.filterIndexed { id, _ -> id != index }.forEach { it.isSelected = false }
            }
        }

        configure()
    }

    override fun onSupportNavigateUp() = finish().run { true }

    override fun onBackPressed() {
        try {
            if (viewPager.currentItem == 2) {
                viewPager.setCurrentItem(0, true)
            } else {
                val currentView = (viewList[viewPager.currentItem] as EmailListFragment).root
                with(currentView.findViewById<LinearLayout>(R.id.email_content_layout)) {
                    if (visibility == View.VISIBLE) {
                        visibility = View.GONE
                        currentView.findViewById<SwipeRefreshLayout>(R.id.email_list_swipe_refresh).visibility =
                            View.VISIBLE
                    } else {
                        finish()
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    internal class EmailConfigurationLayout(context: Context) : LinearLayout(context) {
        val name: EditText
        val host: Spinner

        init {
            (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
                .inflate(R.layout.item_email_configuration, this, true)
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

    private lateinit var viewPager: ViewPager

    companion object {
        lateinit var inboxFolder: List<Message>
        lateinit var sentFolder: List<Message>

        val inboxInitialized: Boolean get() = ::inboxFolder.isInitialized
        val sentInitialized: Boolean get() = ::sentFolder.isInitialized
    }

    private val handler = Handler()

    private val loggedInUser get() = LoginActivity.loginViewModel.getLoggedInUser()
}