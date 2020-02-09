package com.unidy2002.thuinfo.ui.email

import android.Manifest
import android.app.DownloadManager
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.View.GONE
import android.view.View.VISIBLE
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.email.EmailListAdapter
import com.unidy2002.thuinfo.data.model.email.EmailModel
import com.unidy2002.thuinfo.data.util.Email.folder
import com.unidy2002.thuinfo.data.util.Email.getEmailList
import com.unidy2002.thuinfo.data.util.Email.openFolder
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeoutException
import javax.mail.Part
import kotlin.concurrent.thread


class EmailListFragment : Fragment() {

    lateinit var root: View

    private lateinit var currentId: String
    private lateinit var currentContent: EmailModel.EmailContent

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        root = inflater.inflate(R.layout.fragment_email_list, container, false)
        return root
    }

    override fun onStart() {
        // Two modules in one
        val swipeRefresh = view?.findViewById<SwipeRefreshLayout>(R.id.email_list_swipe_refresh)
        val recyclerView = view?.findViewById<RecyclerView>(R.id.email_list_recycler_view)
        val contentLayout = view?.findViewById<LinearLayout>(R.id.email_content_layout)
        val webView = view?.findViewById<WebView>(R.id.email_content_view)

        // Email list related
        arguments?.getString("folder")?.run folder@{
            fun fetchData(force: Boolean) {
                try {
                    (recyclerView?.adapter as? EmailListAdapter)?.run {
                        openFolder(this@folder, force)
                        folder[this@folder]?.run {
                            val startIndex = if (force) 0 else itemCount
                            with(getEmailList(this@folder, this, startIndex)) {
                                activity?.runOnUiThread { push(this, startIndex) }
                            }
                        }
                    }
                } catch (e: TimeoutException) {
                    e.printStackTrace()
                    context?.run { Toast.makeText(this, R.string.email_timeout_string, Toast.LENGTH_SHORT).show() }
                } catch (e: Exception) {
                    e.printStackTrace()
                    context?.run { Toast.makeText(this, R.string.email_exception_string, Toast.LENGTH_SHORT).show() }
                } finally {
                    swipeRefresh?.isRefreshing = false
                }
            }

            recyclerView?.layoutManager = LinearLayoutManager(context)
            recyclerView?.adapter = EmailListAdapter().apply {
                setOnItemClickListener(object : EmailListAdapter.OnItemClickListener {
                    override fun onClick(index: Int) {
                        thread {
                            try {
                                folder[this@folder]?.get(index)?.run {
                                    with(EmailModel(this)) {
                                        currentId = messageId
                                        currentContent = content
                                        activity?.runOnUiThread {
                                            swipeRefresh?.visibility = GONE
                                            contentLayout?.visibility = VISIBLE
                                            webView?.loadData("", "text/plain", "utf-8")
                                            view?.findViewById<TextView>(R.id.email_content_title)?.text = subject
                                            view?.findViewById<TextView>(R.id.email_content_sender)?.text =
                                                from.toString()
                                            view?.findViewById<TextView>(R.id.email_content_time)?.text =
                                                SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).format(date)
                                            view?.findViewById<TextView>(R.id.email_content_receiver)?.text =
                                                to.joinToString("; ")
                                            view?.findViewById<ImageView>(R.id.email_content_attachment)?.visibility =
                                                if (content.attachments.isEmpty()) GONE else VISIBLE
                                            val modeText = view?.findViewById<TextView>(R.id.email_content_mode)
                                            modeText?.text = ""
                                            modeText?.isEnabled = false
                                            if (!isRead) {
                                                isRead = true
                                                (recyclerView?.adapter as? EmailListAdapter)?.markRead(index)
                                            }
                                            if (content.hasHtml) {
                                                webView?.loadData(content.html, "text/html", "utf-8")
                                                if (content.hasPlain) {
                                                    modeText?.setText(R.string.email_plain_string)
                                                    modeText?.isEnabled = true
                                                }
                                            } else if (content.hasPlain) {
                                                webView?.loadData(content.plain, "text/plain", "utf-8")
                                            } else {
                                                webView?.loadData("加载失败", "text/plain", "utf-8")
                                            }
                                        }
                                    }
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    }
                })
            }
            recyclerView?.addOnScrollListener(object : EmailListAdapter.OnLoadMoreListener() {
                override fun onLoading() {
                    thread { fetchData(false) }
                }
            }.also { (recyclerView.adapter as? EmailListAdapter)?.onLoadMoreListener = it })

            swipeRefresh?.apply {
                isRefreshing = true
                setColorSchemeResources(R.color.colorAccent)
                setOnRefreshListener { thread { fetchData(true) } }
            }

            thread { fetchData(false) }
        }

        // Email content related
        view?.findViewById<TextView>(R.id.email_content_back)?.setOnClickListener {
            contentLayout?.visibility = GONE
            swipeRefresh?.visibility = VISIBLE
        }

        view?.findViewById<TextView>(R.id.email_content_mode)?.apply {
            setOnClickListener {
                try {
                    if (text == resources.getString(R.string.email_plain_string) && currentContent.hasPlain) {
                        text = resources.getString(R.string.email_html_string)
                        webView?.loadData(currentContent.plain, "text/plain", "utf-8")
                    } else if (text == resources.getString(R.string.email_html_string) && currentContent.hasHtml) {
                        text = resources.getString(R.string.email_plain_string)
                        webView?.loadData(currentContent.html, "text/html", "utf-8")
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    context?.run { Toast.makeText(this, R.string.email_op_fail, Toast.LENGTH_SHORT).show() }
                }
            }
        }

        view?.findViewById<ImageView>(R.id.email_content_attachment)?.setOnClickListener {
            try {
                PopupWindow(
                    (LayoutInflater.from(context!!).inflate(R.layout.item_attachment_list, null) as ListView).apply {
                        adapter = ArrayAdapter(
                            context!!,
                            R.layout.item_attachment_text,
                            currentContent.attachments.map { part -> part.fileName })
                        setOnItemClickListener { _, _, position, _ ->
                            try {
                                emailDownload(currentId, currentContent.attachments[position])
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    },
                    (view!!.width / 1.4).toInt(),
                    WRAP_CONTENT
                ).run {
                    isOutsideTouchable = true
                    setBackgroundDrawable(ColorDrawable(Color.WHITE))
                    showAsDropDown(it)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // Allows web view to display inline images
        webView?.apply {
            settings.allowUniversalAccessFromFileURLs = true
            settings.allowFileAccess = true
            settings.allowFileAccessFromFileURLs = true
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                    if (request.url.scheme == "cid")
                        try {
                            currentContent.images[request.url.toString().run { substring(indexOf("cid") + 4) }]?.inputStream?.run {
                                val result = WebResourceResponse("image/*", "UTF-8", this)
                                close()
                                return result
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    return super.shouldInterceptRequest(view, request)
                }
            }
        }

        super.onStart()
    }

    /**
     * This method is awful... But I don't know how to make it better...
     * (Having poor knowledge of android file system)
     */
    private fun emailDownload(messageId: String, attachment: Part) { // TODO: clear cache regularly
        thread {
            try {                                                    // TODO: use better way of downloading
                activity?.run {
                    runOnUiThread { Toast.makeText(this, R.string.downloading_string, Toast.LENGTH_SHORT).show() }
                }
                val permission = activity!!.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                if (permission != PackageManager.PERMISSION_GRANTED)
                    requestPermissions(
                        arrayOf(
                            Manifest.permission.READ_EXTERNAL_STORAGE,
                            Manifest.permission.WRITE_EXTERNAL_STORAGE
                        ), 1
                    )
                val dir = File("${activity!!.getExternalFilesDir(null)!!.path}/cache/email/$messageId")
                if (!dir.exists()) dir.mkdirs()
                val file = File(dir, attachment.fileName).also { println(it.absolutePath) }
                val outputStream = FileOutputStream(file)
                outputStream.write(attachment.inputStream.readBytes())
                outputStream.close()
                attachment.inputStream.close()
                (activity!!.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).addCompletedDownload(
                    file.name,
                    file.name,
                    true,
                    attachment.contentType,
                    file.absolutePath,
                    file.length(),
                    true
                )
            } catch (e: Exception) {
                e.printStackTrace()
                try {
                    activity?.run {
                        runOnUiThread { Toast.makeText(this, R.string.download_fail_string, Toast.LENGTH_SHORT).show() }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }
}