package com.unidy2002.thuinfo.ui.news

import android.app.DownloadManager
import android.content.IntentFilter
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.util.Network
import com.unidy2002.thuinfo.data.util.DownloadCompleteReceiver
import com.unidy2002.thuinfo.data.util.downloadBySystem
import com.unidy2002.thuinfo.ui.login.LoginActivity
import kotlin.concurrent.thread

class WebFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_web, container, false)

    private fun loadURL(view: WebView, url: String) {
        thread {
            Network().getPrettyPrintHTML(url).run {
                view.handler.post {
                    if (this == null) {
                        view.loadUrl(url)
                    } else {
                        view.loadDataWithBaseURL(url, toString(), "text/html", "utf-8", null)
                    }
                }
            }
        }
    }

    override fun onStart() {
        CookieManager.getInstance()
            .setCookie("webvpn.tsinghua.edu.cn", LoginActivity.loginViewModel.getLoggedInUser().vpnTicket)

        view?.findViewById<WebView>(R.id.web_view)?.apply {
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    loadURL(view, request.url.toString())
                    return true
                }
            }

            setDownloadListener { url, _, contentDisposition, mimetype, _ ->
                try { // TODO: 中文文件名乱码
                    downloadBySystem(url, contentDisposition, mimetype, activity!!)
                    activity?.registerReceiver(
                        DownloadCompleteReceiver(),
                        IntentFilter().apply { addAction(DownloadManager.ACTION_DOWNLOAD_COMPLETE) }
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            loadURL(this, arguments!!.getString("url")!!)
        }

        super.onStart()
    }
}