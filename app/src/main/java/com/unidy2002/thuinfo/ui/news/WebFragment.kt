package com.unidy2002.thuinfo.ui.news

import android.app.DownloadManager
import android.content.IntentFilter
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.view.isEmpty
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.MainActivity
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.network.getPrettyPrintHTML
import com.unidy2002.thuinfo.data.util.DownloadCompleteReceiver
import com.unidy2002.thuinfo.data.util.downloadBySystem
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_web.*

class WebFragment : Fragment() {

    var viewPretty = true
    private var lastUrl = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_web, container, false)

    fun loadURL(view: WebView, url: String = lastUrl) {
        if (url.isNotEmpty()) {
            safeThread {
                getPrettyPrintHTML(url).run {
                    view.handler.post {
                        if (this == null || !viewPretty) {
                            view.loadUrl(url)
                        } else {
                            view.loadDataWithBaseURL(url, toString(), "text/html", "utf-8", null)
                        }
                    }
                }
            }
        }
        lastUrl = url
    }

    override fun onStart() {
        super.onStart()

        web_view.apply {
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

        (activity as? MainActivity)?.run {
            webFragment = this@WebFragment
            if (menu.isEmpty()) menuInflater.inflate(R.menu.news_web_menu, menu)
        }
    }

    override fun onDestroy() {
        try {
            (activity as MainActivity).menu.clear()
            (activity as MainActivity).webFragment = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onDestroy()
    }
}