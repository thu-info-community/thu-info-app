package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.os.Handler
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
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

    private val handler = Handler()

    private fun getData() {
        thread(start = true) {
            val report = Network().getReport()
            handler.post {
                view?.findViewById<RecyclerView>(R.id.report_recycler_view)?.adapter = ReportAdapter(report ?: listOf())
                view?.findViewById<SwipeRefreshLayout>(R.id.report_swipe_refresh)?.isRefreshing = false
            }
        }
    }

    override fun onStart() {
        val recyclerView = view?.findViewById<RecyclerView>(R.id.report_recycler_view)
        recyclerView?.layoutManager = LinearLayoutManager(context)
        recyclerView?.adapter = ReportAdapter(listOf())
        val refresh = view?.findViewById<SwipeRefreshLayout>(R.id.report_swipe_refresh)
        refresh?.isRefreshing = true
        refresh?.setColorSchemeResources(R.color.colorAccent)
        refresh?.setOnRefreshListener { getData() }
        getData()
        super.onStart()
    }
}