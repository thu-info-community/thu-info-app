package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.Network
import com.unidy2002.thuinfo.data.model.report.ReportAdapter
import kotlin.concurrent.thread

class ReportFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_report, container, false)
    }

    private fun getData() {
        thread(start = true) {
            val report = Network().getReport()
            view?.handler?.post {
                view?.findViewById<RecyclerView>(R.id.report_recycler_view)?.adapter = ReportAdapter(report ?: listOf())
                view?.findViewById<SwipeRefreshLayout>(R.id.report_swipe_refresh)?.isRefreshing = false
                report ?: Toast.makeText(context, R.string.timeout_retry, Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onStart() {
        view?.findViewById<RecyclerView>(R.id.report_recycler_view)?.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ReportAdapter(listOf())
        }
        view?.findViewById<SwipeRefreshLayout>(R.id.report_swipe_refresh)?.apply {
            isRefreshing = true
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { getData() }
        }
        getData()
        super.onStart()
    }
}