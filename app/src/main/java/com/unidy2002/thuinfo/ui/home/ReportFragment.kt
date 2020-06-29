package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.unidy2002.thuinfo.MainActivity
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.report.ReportAdapter
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getReport
import com.unidy2002.thuinfo.data.util.safePost
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_report.*

class ReportFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_report, container, false)

    private fun getData() {
        safeThread {
            val report = Network.getReport()
            view?.handler?.safePost {
                report ?: context?.run { Toast.makeText(this, R.string.timeout_retry, Toast.LENGTH_SHORT).show() }
                report_recycler_view.adapter = ReportAdapter(report ?: listOf())
                report_swipe_refresh.isRefreshing = false
            }
        }
    }

    override fun onStart() {
        super.onStart()

        report_recycler_view.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ReportAdapter(listOf())
        }

        report_swipe_refresh.apply {
            isRefreshing = true
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { getData() }
        }

        (activity as? MainActivity)?.run {
            menu.removeItem(R.id.item_pay_for_report)
            menuInflater.inflate(R.menu.pay_for_report_menu, menu)
        }
        getData()
    }

    override fun onPause() {
        super.onPause()

        (activity as? MainActivity)?.menu?.removeItem(R.id.item_pay_for_report)
    }
}