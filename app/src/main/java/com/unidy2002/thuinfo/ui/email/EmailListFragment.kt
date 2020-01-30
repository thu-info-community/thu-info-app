package com.unidy2002.thuinfo.ui.email

import android.os.Bundle
import android.os.Handler
import android.view.LayoutInflater
import android.view.View
import android.view.View.GONE
import android.view.View.VISIBLE
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.getEmailList
import com.unidy2002.thuinfo.data.lib.openInbox
import com.unidy2002.thuinfo.data.lib.openSent
import com.unidy2002.thuinfo.data.model.email.EmailListAdapter
import com.unidy2002.thuinfo.data.model.email.EmailModel
import com.unidy2002.thuinfo.ui.email.EmailActivity.Companion.inboxFolder
import com.unidy2002.thuinfo.ui.email.EmailActivity.Companion.sentFolder
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeoutException
import kotlin.concurrent.thread

class EmailListFragment : Fragment() {

    lateinit var root: View

    private lateinit var currentContent: EmailModel.EmailContent

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        root = inflater.inflate(R.layout.fragment_email_list, container, false)
        return root
    }

    private val handler = Handler()

    override fun onStart() {
        arguments?.getBoolean("inbox")?.run {
            view?.findViewById<RecyclerView>(R.id.email_list_recycler_view)?.apply {
                layoutManager = LinearLayoutManager(context)
                adapter = EmailListAdapter(this@run).apply {
                    setOnItemClickListener(object : EmailListAdapter.OnItemClickListener {
                        override fun onClick(index: Int, emailModel: EmailModel) {
                            view?.findViewById<SwipeRefreshLayout>(R.id.email_list_swipe_refresh)?.visibility = GONE
                            view?.findViewById<LinearLayout>(R.id.email_content_layout)?.visibility = VISIBLE
                            view?.findViewById<TextView>(R.id.email_content_title)?.text = emailModel.subject
                            view?.findViewById<TextView>(R.id.email_content_sender)?.text = emailModel.from.toString()
                            view?.findViewById<TextView>(R.id.email_content_time)?.text =
                                SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).format(emailModel.date)
                            view?.findViewById<TextView>(R.id.email_content_receiver)?.text =
                                emailModel.to.joinToString("; ")
                            view?.findViewById<WebView>(R.id.email_content_view)?.loadData("", "text/plain", "utf-8")
                            val modeText = view?.findViewById<TextView>(R.id.email_content_mode)
                            modeText?.text = ""
                            modeText?.isEnabled = false
                            thread {
                                currentContent = emailModel.content
                                handler?.post {
                                    if (currentContent.hasHtml) {
                                        view?.findViewById<WebView>(R.id.email_content_view)?.loadData(
                                            currentContent.html, "text/html", "utf-8"
                                        ) // TODO: parse cid value (hint - part.getHeader("Content-Id") to match cid)
                                        if (currentContent.hasPlain) {
                                            modeText?.text = resources.getString(R.string.email_plain_string)
                                            modeText?.isEnabled = true
                                        }
                                    } else if (currentContent.hasPlain) {
                                        view?.findViewById<WebView>(R.id.email_content_view)?.loadData(
                                            currentContent.plain, "text/plain", "utf-8"
                                        )
                                    } else {
                                        view?.findViewById<WebView>(R.id.email_content_view)?.loadData(
                                            resources.getString(R.string.load_fail_string), "text/plain", "utf-8"
                                        )
                                    }
                                }
                            }
                            if (!emailModel.isRead) emailModel.isRead = true
                            adapter?.notifyItemChanged(index)
                        }
                    })
                }
            }

            fun fetchData(force: Boolean) { // TODO: 10 at a time
                try {
                    val result = if (this) {
                        openInbox(force)
                        getEmailList(inboxFolder)
                    } else {
                        openSent(force)
                        getEmailList(sentFolder)
                    }
                    activity?.run {
                        handler.post {
                            (view?.findViewById<RecyclerView>(R.id.email_list_recycler_view)?.adapter as EmailListAdapter)
                                .push(result, true)
                        }
                    }
                } catch (e: TimeoutException) {
                    e.printStackTrace()
                    Toast.makeText(context, resources.getString(R.string.email_timeout_string), Toast.LENGTH_SHORT)
                        .show()
                } catch (e: Exception) {
                    e.printStackTrace()
                    Toast.makeText(context, resources.getString(R.string.email_exception_string), Toast.LENGTH_SHORT)
                        .show()
                } finally {
                    view?.findViewById<SwipeRefreshLayout>(R.id.email_list_swipe_refresh)?.isRefreshing = false
                }
            }

            val swipeRefresh = view?.findViewById<SwipeRefreshLayout>(R.id.email_list_swipe_refresh)
            swipeRefresh?.isRefreshing = true
            swipeRefresh?.setColorSchemeResources(R.color.colorAccent)
            swipeRefresh?.setOnRefreshListener {
                thread { fetchData(true) }
            }
            thread { fetchData(false) }
        }
        view?.findViewById<TextView>(R.id.email_content_back)?.setOnClickListener {
            view?.findViewById<LinearLayout>(R.id.email_content_layout)?.visibility = GONE
            view?.findViewById<SwipeRefreshLayout>(R.id.email_list_swipe_refresh)?.visibility = VISIBLE
        }
        view?.findViewById<TextView>(R.id.email_content_mode)?.apply {
            setOnClickListener {
                try {
                    if (text == resources.getString(R.string.email_plain_string) && currentContent.hasPlain) {
                        text = resources.getString(R.string.email_html_string)
                        view?.findViewById<WebView>(R.id.email_content_view)?.loadData(
                            currentContent.plain, "text/plain", "utf-8"
                        )
                    } else if (text == resources.getString(R.string.email_html_string) && currentContent.hasHtml) {
                        text = resources.getString(R.string.email_plain_string)
                        view?.findViewById<WebView>(R.id.email_content_view)?.loadData(
                            currentContent.html, "text/html", "utf-8"
                        )
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    try {
                        Toast.makeText(context, R.string.email_op_fail, Toast.LENGTH_SHORT).show()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
        super.onStart()
    }
}