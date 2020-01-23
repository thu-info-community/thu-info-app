package com.unidy2002.thuinfo.ui.news

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.ui.login.LoginActivity

class WebFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_web, container, false)

    override fun onStart() {
        CookieManager.getInstance().setCookie("webvpn.tsinghua.edu.cn", LoginActivity.loginViewModel.getLoggedInUser().vpnTicket)
        val webView = view?.findViewById<WebView>(R.id.web_view)
        webView?.webViewClient = WebViewClient()
        webView?.loadUrl(arguments?.getString("url"))
        super.onStart()
    }
}