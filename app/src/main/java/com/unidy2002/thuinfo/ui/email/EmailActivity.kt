package com.unidy2002.thuinfo.ui.email

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.NavController
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupActionBarWithNavController
import com.sun.mail.imap.IMAPStore
import com.unidy2002.thuinfo.R

class EmailActivity : AppCompatActivity() {

    private lateinit var appBarConfiguration: AppBarConfiguration
    private lateinit var navController: NavController

    lateinit var imapStore: IMAPStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_email)
        setSupportActionBar(findViewById(R.id.email_toolbar))

        appBarConfiguration = AppBarConfiguration(setOf())
        navController = findNavController(R.id.email_nav_host_fragment)
        setupActionBarWithNavController(navController, appBarConfiguration)
    }

    override fun onSupportNavigateUp() =
        navController.navigateUp(appBarConfiguration) || super.onSupportNavigateUp() || onBackPressed().run { true }
}