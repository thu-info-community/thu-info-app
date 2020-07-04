package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatActivity.MODE_PRIVATE
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

    private var bx = false

    private fun getData() {
        safeThread {
            val report = Network.getReport(bx)
            view?.handler?.safePost {
                report ?: context?.run { Toast.makeText(this, R.string.timeout_retry, Toast.LENGTH_SHORT).show() }
                report_recycler_view.adapter = ReportAdapter(report ?: listOf())
                report_swipe_refresh.isRefreshing = false
            }
        }
    }

    override fun onStart() {
        super.onStart()

        bx = arguments?.getBoolean("bx") ?: false
        if (bx) (activity as? AppCompatActivity)?.supportActionBar?.setTitle(R.string.report_bx_str)

        try {
            activity?.getSharedPreferences("config", MODE_PRIVATE)?.run {
                if (!getBoolean("bx", false)) {
                    edit().putBoolean("bx", true).apply()
                    AlertDialog.Builder(context!!)
                        .setTitle("试验性功能 必限成绩单 上线")
                        .setMessage("点击屏幕右上角三个点即可找到，如有算错或遗漏欢迎及时反馈，谢谢！")
                        .show()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        report_recycler_view.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ReportAdapter(listOf())
        }

        report_swipe_refresh.apply {
            isRefreshing = true
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { getData() }
        }

        if (!bx) {
            (activity as? MainActivity)?.run {
                menu.removeItem(R.id.item_pay_for_report)
                menu.removeItem(R.id.report_bx_btn)
                menuInflater.inflate(R.menu.pay_for_report_menu, menu)
            }
        }
        getData()
    }

    override fun onPause() {
        super.onPause()

        if (!bx) {
            (activity as? MainActivity)?.menu?.run {
                removeItem(R.id.item_pay_for_report)
                removeItem(R.id.report_bx_btn)
            }
        }
    }
}