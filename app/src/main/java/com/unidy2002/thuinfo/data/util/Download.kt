package com.unidy2002.thuinfo.data.util

import android.app.Activity
import android.app.DownloadManager
import android.app.DownloadManager.Request
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Context.DOWNLOAD_SERVICE
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.util.Log
import android.webkit.URLUtil
import android.widget.Toast
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.ui.login.LoginActivity

fun downloadBySystem(url: String, contentDisposition: String, mimeType: String, activity: Activity) {
    (activity.getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(
        Request(Uri.parse(url)).apply {
            addRequestHeader("Cookie", LoginActivity.loginViewModel.getLoggedInUser().vpnTicket)
            setNotificationVisibility(Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setTitle(activity.resources.getString(R.string.downloading_string))
            setAllowedNetworkTypes(Request.NETWORK_MOBILE or Request.NETWORK_WIFI)
            setAllowedOverMetered(true)
            setAllowedOverRoaming(true)
            setDestinationInExternalPublicDir(
                Environment.DIRECTORY_DOWNLOADS,
                URLUtil.guessFileName(url, contentDisposition, mimeType).also {
                    Log.i("Download fileName", it)
                }
            )
        }
    ).also { Log.i("Download ID start", it.toString()) }
}

class DownloadCompleteReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent != null && intent.action == DownloadManager.ACTION_DOWNLOAD_COMPLETE) {
            val downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
            Log.i("Download ID finished", downloadId.toString())
            (context.getSystemService(DOWNLOAD_SERVICE) as DownloadManager).getUriForDownloadedFile(downloadId)?.run {
                Toast.makeText(context, R.string.download_succeed_string, Toast.LENGTH_SHORT).show()
            }
        }
        context.unregisterReceiver(this)
    }
}

