package com.unidy2002.thuinfo.data.network

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Environment
import android.util.Log
import android.widget.Toast
import com.alibaba.fastjson.JSON
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.util.getVersionCode
import java.io.BufferedReader
import java.io.InputStreamReader

data class UpdateInfo(val versionCode: Int, val versionName: String, val url: String, val description: String)

fun Network.getUpdateInfo(context: Context) = try {
    connect(
        "https://cloud.tsinghua.edu.cn/f/1047a13451f44ab99d3a/?dl=1",
        "https://cloud.tsinghua.edu.cn"
    ).inputStream.run {
        val reader = BufferedReader(InputStreamReader(this))
        val data = JSON.parseArray(reader.readLine(), UpdateInfo::class.java)
        reader.close()
        close()
        if (data.last().versionCode > getVersionCode(context)) data.last() else null
    }
} catch (e: Exception) {
    e.printStackTrace()
    null
}

fun downloadUpdate(context: Context, url: String, versionName: String) {
    val id = (context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(
        DownloadManager.Request(Uri.parse(url)).apply {
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setTitle("THUInfo_v$versionName 安装包下载")
            setAllowedNetworkTypes(DownloadManager.Request.NETWORK_MOBILE or DownloadManager.Request.NETWORK_WIFI)
            setAllowedOverMetered(true)
            setAllowedOverRoaming(true)
            setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "THUInfo_v$versionName.apk")
        }
    )
    context.registerReceiver(
        DownloadUpdateCompleteReceiver(id),
        IntentFilter().apply { addAction(DownloadManager.ACTION_DOWNLOAD_COMPLETE) }
    )
    Log.i("Download ID start", id.toString())
}

class DownloadUpdateCompleteReceiver(val id: Long) : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent != null && intent.action == DownloadManager.ACTION_DOWNLOAD_COMPLETE
            && id == intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
        ) {
            Log.i("Download ID finished", id.toString())
            (context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).getUriForDownloadedFile(id)?.run {
                Toast.makeText(context, R.string.please_install_manually, Toast.LENGTH_LONG).show()
                /* try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        if (context.packageManager.canRequestPackageInstalls()) {
                            install(this)
                        } else {
                            // Request permission
                            (context as MainActivity).uriTemp = this
                            val packageURI = Uri.parse("package:${context.packageName}")
                            val request = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, packageURI)
                            startActivityForResult(context as Activity, request, 233, Bundle.EMPTY)
                        }
                    } else {
                        install(this)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    Toast.makeText(context, "安装失败", Toast.LENGTH_SHORT).show()
                } */
            }
        }
        context.unregisterReceiver(this)
    }
}
