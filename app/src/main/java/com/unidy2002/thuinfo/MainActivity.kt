package com.unidy2002.thuinfo

import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.webkit.WebView
import android.widget.TextView
import android.widget.Toast
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
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.dao.HoleIgnoreDB
import com.unidy2002.thuinfo.data.dao.ScheduleDBManager
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.model.login.revokeUser
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getTicket
import com.unidy2002.thuinfo.data.network.getUpdateInfo
import com.unidy2002.thuinfo.data.util.Email.connectImap
import com.unidy2002.thuinfo.data.util.Email.getInboxUnread
import com.unidy2002.thuinfo.data.util.imageToBase64
import com.unidy2002.thuinfo.data.util.safeThread
import com.unidy2002.thuinfo.ui.email.EmailActivity
import com.unidy2002.thuinfo.ui.news.WebFragment
import com.unidy2002.thuinfo.ui.report.ReportActivity
import com.wildma.pictureselector.FileUtils.deleteAllCacheImage
import com.wildma.pictureselector.PictureBean
import com.wildma.pictureselector.PictureSelector
import jackmego.com.jieba_android.JiebaSegmenter
import java.util.*
import kotlin.concurrent.schedule


class MainActivity : AppCompatActivity() {

    private lateinit var appBarConfiguration: AppBarConfiguration
    private lateinit var navController: NavController
    private lateinit var toolbar: Toolbar
    private var inboxUnread = 0

    private val topLevelDestinationIds = setOf(R.id.navigation_home, R.id.navigation_news, R.id.navigation_schedule)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Setup bottom navigator, toolbar and drawer
        toolbar = findViewById(R.id.toolbar)
        setSupportActionBar(toolbar)

        navController = findNavController(R.id.nav_host_fragment)
        appBarConfiguration = AppBarConfiguration(topLevelDestinationIds, findViewById(R.id.drawer_layout))
        setupActionBarWithNavController(navController, appBarConfiguration)
        findViewById<BottomNavigationView>(R.id.bottom_nav_view).setupWithNavController(navController)

        navController.addOnDestinationChangedListener { _, destination, _ ->
            if (destination.id in topLevelDestinationIds) refreshBadge(false)
        }

        // Important network operations
        for ((id, _) in loggedInUser.connectionState)
            safeThread { Network.getTicket(id) }
        safeThread {
            Network.getUsername()
            try {
                runOnUiThread { findViewById<TextView>(R.id.full_name_text).text = loggedInUser.fullName }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        safeThread {
            if (loggedInUser.emailAddressInitialized())
                try {
                    connectImap(loggedInUser.emailAddress, loggedInUser.password)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            runOnUiThread { loggedInUser.timerTasks.add(Timer().schedule(0, 30000) { refreshBadge(true) }) }
        }

        // Initialize singletons
        safeThread { JiebaSegmenter.init(applicationContext) }
        safeThread { ScheduleDBManager.init(applicationContext) }
        safeThread { HoleIgnoreDB.init(applicationContext) }

        // Read configuration data
        loggedInUser.allowEnterCourseSelection =
            getSharedPreferences(loggedInUser.userId, MODE_PRIVATE).getBoolean("enter_selection", false)

        // Check update
        checkUpdate()
    }

    // Setup drawer navigation action
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        this.menu = menu
        findViewById<TextView>(R.id.full_name_text).text = loggedInUser.fullName
        findViewById<TextView>(R.id.user_id_text).text = loggedInUser.userId
        findViewById<NavigationView>(R.id.side_nav_view).setNavigationItemSelectedListener {
            when (it.itemId) {
                R.id.navigation_email ->
                    startActivity(Intent().apply { setClass(this@MainActivity, EmailActivity::class.java) })
                R.id.navigation_report ->
                    AlertDialog.Builder(this)
                        .setTitle(report_guide_text)
                        .setView(R.layout.report_guide)
                        .setPositiveButton(report_guide_quick) { _, _ ->
                            startActivity(Intent().apply { setClass(this@MainActivity, ReportActivity::class.java) })
                        }
                        .show()
                R.id.navigation_update ->
                    checkUpdate(true)
                R.id.navigation_logout -> {
                    safeThread {
                        try {
                            Network.logout()
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                        loggedInUser.timerTasks.forEach { task -> task.cancel() }
                        runOnUiThread {
                            if (loggedInUser.rememberPassword) {
                                AlertDialog.Builder(this)
                                    .setTitle(clear_or_not)
                                    .setPositiveButton(keep_string) { _, _ -> }
                                    .setNegativeButton(clear_string) { _, _ ->
                                        getSharedPreferences("UserId", MODE_PRIVATE).edit().clear().apply()
                                    }
                                    .setOnDismissListener {
                                        revokeUser()
                                        finish()
                                    }
                                    .setCancelable(false)
                                    .show()
                            } else {
                                revokeUser()
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

    // The little red dot, currently designed for email notification.
    private fun refreshBadge(forceUpdate: Boolean) {
        safeThread {
            if (forceUpdate) inboxUnread = getInboxUnread().also { Log.i("Unread", it.toString()) }
            runOnUiThread {
                if (navController.currentDestination?.id in topLevelDestinationIds) {
                    val emailMenuItem = findViewById<NavigationView>(R.id.side_nav_view).menu[0]
                    if (inboxUnread > 0) {
                        emailMenuItem.title = resources.getString(email_string) + " [$inboxUnread]"
                        toolbar.navigationIcon = resources.getDrawable(R.drawable.ic_menu_badge_24dp, null)
                    } else {
                        emailMenuItem.title = resources.getString(email_string)
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

    override fun onSupportNavigateUp() =
        with(findViewById<WebView>(R.id.web_view)) {
            if (this != null && this.canGoBack()) {
                this.goBack()
                true
            } else {
                navController.navigateUp(appBarConfiguration)
            }
        }

    override fun onResume() {
        refreshBadge(true)
        super.onResume()
    }

    // WebFragment-related
    lateinit var menu: Menu
    var webFragment: WebFragment? = null

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        try {
            when (item.itemId) {
                R.id.web_shift_mode -> {
                    if (item.title == resources.getString(string_view_origin)) {
                        webFragment?.viewPretty = false
                        item.title = resources.getString(string_view_pretty)
                    } else {
                        webFragment?.viewPretty = true
                        item.title = resources.getString(string_view_origin)
                    }
                    webFragment?.run { loadURL(findViewById(R.id.web_view)) }
                }
                R.id.web_close -> navController.navigateUp(appBarConfiguration)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return super.onOptionsItemSelected(item)
    }

    // Check update related

    private fun checkUpdate(force: Boolean = false) = safeThread {
        Network.getUpdateInfo(applicationContext)?.run {
            if (force || getSharedPreferences("UserId", MODE_PRIVATE).getInt("DoNotRemind", 0) < versionCode) {
                runOnUiThread {
                    try {
                        AlertDialog.Builder(this@MainActivity)
                            .setTitle(have_new_version)
                            .setMessage("$versionName\n$description")
                            .setPositiveButton(download_string) { _, _ ->
                                try {
                                    Toast.makeText(this@MainActivity, download_start, Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                }
                                try {
                                    /* action = {
                                        val installIntent = Intent(Intent.ACTION_VIEW)
                                        installIntent.setDataAndType(it, "application/vnd.android.package-archive")
                                        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                        println(it)
                                        println(it.path)
                                        println(installIntent)
                                        startActivity(installIntent)
                                    }
                                    downloadUpdate(this@MainActivity, url, versionName) */
                                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                    Toast.makeText(this@MainActivity, download_fail, Toast.LENGTH_SHORT).show()
                                }
                            }
                            .setNegativeButton(next_time) { _, _ -> }
                            .setNeutralButton(do_not_remind) { _, _ ->
                                getSharedPreferences("UserId", MODE_PRIVATE).edit()
                                    .putInt("DoNotRemind", versionCode)
                                    .apply()
                            }
                            .show()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        } ?: takeIf { force }?.runOnUiThread {
            Toast.makeText(this@MainActivity, already_up_to_date, Toast.LENGTH_SHORT).show()
        }
    }


    /* override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (resultCode == Activity.RESULT_OK && requestCode == 233) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (packageManager.canRequestPackageInstalls()) {
                    action(uriTemp!!)
                }
            }
        }
    } */

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == PictureSelector.SELECT_REQUEST_CODE) {
            data?.getParcelableExtra<PictureBean>(PictureSelector.PICTURE_RESULT)?.run {
                loggedInUser.currentImageBase64 = imageToBase64(if (isCut) path else uri.toString())
            }
            deleteAllCacheImage(this)
        }
    }
}
