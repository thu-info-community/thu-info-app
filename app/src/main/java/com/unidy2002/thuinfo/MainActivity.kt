package com.unidy2002.thuinfo

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.util.Log
import android.view.Menu
import android.webkit.WebView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.core.view.get
import androidx.navigation.NavController
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.navigation.NavigationView
import com.unidy2002.thuinfo.data.util.Network
import com.unidy2002.thuinfo.data.util.connectImap
import com.unidy2002.thuinfo.data.util.getInboxUnread
import com.unidy2002.thuinfo.ui.email.EmailActivity
import com.unidy2002.thuinfo.ui.login.LoginActivity
import com.unidy2002.thuinfo.ui.report.ReportActivity
import jackmego.com.jieba_android.JiebaSegmenter
import java.util.*
import kotlin.concurrent.schedule
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity() {

    private lateinit var appBarConfiguration: AppBarConfiguration
    private lateinit var navController: NavController
    private lateinit var toolbar: Toolbar
    private var inboxUnread = 0

    private val topLevelDestinationIds = setOf(R.id.navigation_home, R.id.navigation_news, R.id.navigation_schedule)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        toolbar = findViewById(R.id.toolbar)
        setSupportActionBar(toolbar)

        navController = findNavController(R.id.nav_host_fragment)
        appBarConfiguration = AppBarConfiguration(topLevelDestinationIds, findViewById(R.id.drawer_layout))
        setupActionBarWithNavController(navController, appBarConfiguration)
        findViewById<BottomNavigationView>(R.id.bottom_nav_view).setupWithNavController(navController)

        navController.addOnDestinationChangedListener { _, destination, _ ->
            if (destination.id in topLevelDestinationIds) refreshBadge(false)
        }

        thread { Network.getTicket(792) }
        thread { Network.getTicket(824) }
        thread {
            Network.getUsername()
            try {
                handler.post { findViewById<TextView>(R.id.full_name_text).text = loggedInUser.fullName }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        thread {
            Network.getTicket(-1)
            try {
                handler.post { findViewById<TextView>(R.id.user_dorm_text).text = loggedInUser.dormitory }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        thread {
            if (loggedInUser.emailAddressInitialized())
                try {
                    connectImap(loggedInUser.emailAddress, loggedInUser.password)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            handler.post { loggedInUser.timerTasks.add(Timer().schedule(0, 30000) { refreshBadge(true) }) }
        }

        JiebaSegmenter.init(applicationContext)
    }

    private val handler = Handler()

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        findViewById<TextView>(R.id.full_name_text).text = loggedInUser.fullName
        findViewById<TextView>(R.id.user_id_text).text = loggedInUser.userId
        findViewById<TextView>(R.id.user_dorm_text).text = loggedInUser.dormitory
        findViewById<NavigationView>(R.id.side_nav_view).setNavigationItemSelectedListener {
            when (it.itemId) {
                R.id.navigation_email ->
                    startActivity(Intent().apply { setClass(this@MainActivity, EmailActivity::class.java) })
                R.id.navigation_report ->
                    AlertDialog.Builder(this)
                        .setTitle(R.string.report_guide_text)
                        .setView(R.layout.report_guide)
                        .setPositiveButton(R.string.report_guide_quick) { _, _ ->
                            startActivity(Intent().apply { setClass(this@MainActivity, ReportActivity::class.java) })
                        }
                        .show()
                R.id.navigation_logout -> {
                    thread {
                        Network.logout()
                        handler.post {
                            if (loggedInUser.rememberPassword) {
                                AlertDialog.Builder(this)
                                    .setTitle(R.string.clear_or_not)
                                    .setPositiveButton(R.string.keep_string) { _, _ -> }
                                    .setNegativeButton(R.string.clear_string) { _, _ ->
                                        getSharedPreferences("UserId", MODE_PRIVATE).edit().clear().apply()
                                    }
                                    .setOnDismissListener {
                                        thread {
                                            LoginActivity.loginViewModel.logout()
                                            handler.post { finish() }
                                        }
                                    }
                                    .setCancelable(false)
                                    .show()
                            } else {
                                thread {
                                    LoginActivity.loginViewModel.logout()
                                    handler.post { finish() }
                                }
                            }
                        }
                    }
                }
            }
            true
        }
        return true
    }

    private fun refreshBadge(forceUpdate: Boolean) {
        thread {
            if (forceUpdate) inboxUnread = getInboxUnread().also { Log.i("Unread", it.toString()) }
            handler.post {
                if (navController.currentDestination?.id in topLevelDestinationIds) {
                    val emailMenuItem = findViewById<NavigationView>(R.id.side_nav_view).menu[0]
                    if (inboxUnread > 0) {
                        emailMenuItem.title = resources.getString(R.string.email_string) + " [$inboxUnread]"
                        toolbar.navigationIcon = resources.getDrawable(R.drawable.ic_menu_badge_24dp, null)
                    } else {
                        emailMenuItem.title = resources.getString(R.string.email_string)
                        if (forceUpdate)
                            toolbar.navigationIcon = resources.getDrawable(R.drawable.ic_menu_24dp, null)
                    }
                }
            }
        }
    }

    override fun onBackPressed() {
        with(findViewById<WebView>(R.id.web_view)) {
            if (this != null && this.canGoBack()) {
                this.goBack()
            } else {
                super.onBackPressed()
            }
        }
    }

    override fun onSupportNavigateUp() = navController.navigateUp(appBarConfiguration) || super.onSupportNavigateUp()

    override fun onResume() {
        refreshBadge(true)
        super.onResume()
    }

    private val loggedInUser get() = LoginActivity.loginViewModel.getLoggedInUser()

}
