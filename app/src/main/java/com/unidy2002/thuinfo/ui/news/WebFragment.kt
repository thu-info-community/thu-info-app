package com.unidy2002.thuinfo.ui.news

import android.os.Bundle
import android.os.Handler
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.Network
import com.unidy2002.thuinfo.ui.login.LoginActivity
import kotlin.concurrent.thread

class WebFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_web, container, false)

    val handler = Handler()

    private fun loadURL(view: WebView, url: String) {
        thread(start = true) {
            try {
                val result = Network().getPrettyPrintHTML(url)
                handler.post {
                    view.loadDataWithBaseURL(url, result, "text/html", "utf-8", null)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onStart() {
        CookieManager.getInstance()
            .setCookie("webvpn.tsinghua.edu.cn", LoginActivity.loginViewModel.getLoggedInUser().vpnTicket)
        view?.findViewById<WebView>(R.id.web_view)!!.apply {
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    loadURL(view, request.url.toString())
                    return true
                }
            }
            loadURL(this, arguments?.getString("url")!!)
        }
        super.onStart()
    }
}