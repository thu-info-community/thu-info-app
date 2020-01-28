package com.unidy2002.thuinfo

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.view.Menu
import android.webkit.WebView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.NavController
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.navigation.NavigationView
import com.unidy2002.thuinfo.data.lib.Network
import com.unidy2002.thuinfo.data.model.news.NewsContainer
import com.unidy2002.thuinfo.ui.email.EmailActivity
import com.unidy2002.thuinfo.ui.login.LoginActivity
import jackmego.com.jieba_android.JiebaSegmenter
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity() {

    private lateinit var appBarConfiguration: AppBarConfiguration
    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        setSupportActionBar(findViewById(R.id.toolbar))

        navController = findNavController(R.id.nav_host_fragment)
        appBarConfiguration = AppBarConfiguration(
            setOf(
                R.id.navigation_home, R.id.navigation_news, R.id.navigation_schedule
            ), findViewById(R.id.drawer_layout)
        )
        setupActionBarWithNavController(navController, appBarConfiguration)
        findViewById<BottomNavigationView>(R.id.bottom_nav_view).setupWithNavController(navController)

        thread(start = true) { Network().getTicket(792) }
        thread(start = true) { Network().getTicket(824) }
        thread(start = true) {
            Network().getTicket(-1)
            try {
                handler.post { findViewById<TextView>(R.id.user_dorm_text).text = loggedInUser.dormitory }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        JiebaSegmenter.init(applicationContext)

        loggedInUser.newsContainer = NewsContainer(applicationContext)
    }

    private val handler = Handler()

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        findViewById<TextView>(R.id.username_text).text = loggedInUser.fullName
        findViewById<TextView>(R.id.user_id_text).text = loggedInUser.userId
        findViewById<TextView>(R.id.user_dorm_text).text = loggedInUser.dormitory
        findViewById<NavigationView>(R.id.side_nav_view).setNavigationItemSelectedListener {
            when (it.itemId) {
                R.id.navigation_email ->
                    startActivity(Intent().apply { setClass(this@MainActivity, EmailActivity::class.java) })
                R.id.navigation_logout -> {
                    thread(start = true) {
                        Network().logout()
                        handler.post {
                            if (loggedInUser.rememberPassword) {
                                AlertDialog.Builder(this)
                                    .setTitle("是否清除记住的密码？")
                                    .setPositiveButton("保留") { _, _ ->
                                        finish()
                                    }
                                    .setNegativeButton("清除") { _, _ ->
                                        val sharedPreferences = getSharedPreferences("UserId", MODE_PRIVATE)!!.edit()
                                        sharedPreferences.putString("remember", "false")
                                        sharedPreferences.remove("username")
                                        sharedPreferences.remove("password")
                                        sharedPreferences.apply()
                                        finish()
                                    }
                                    .setCancelable(false)
                                    .show()
                            } else {
                                finish()
                            }
                        }
                    }
                }
            }
            true
        }
        return true
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

    private val loggedInUser get() = LoginActivity.loginViewModel.getLoggedInUser()

}
