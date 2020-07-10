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
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
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

    private var mode = Mode.NORMAL

    private var customOriginal = true

    private fun getData() {
        safeThread {
            val report = Network.getReport(mode)
            view?.handler?.safePost {
                report ?: context?.run { Toast.makeText(this, R.string.timeout_retry, Toast.LENGTH_SHORT).show() }
                report_recycler_view.adapter = ReportAdapter(report ?: listOf(), mode, customOriginal)
                report_swipe_refresh.isRefreshing = false
            }
        }
    }

    override fun onStart() {
        super.onStart()

        (activity as? AppCompatActivity)?.supportActionBar?.setTitle(
            when (arguments?.getString("mode")) {
                "BX" -> {
                    mode = Mode.BX
                    R.string.report_bx_str
                }
                "CUSTOM" -> {
                    mode = Mode.CUSTOM
                    R.string.report_custom_str
                }
                "GRADUATE" -> {
                    mode = Mode.GRADUATE
                    R.string.report_graduate_str

                }
                else -> {
                    mode = Mode.NORMAL
                    R.string.report
                }
            }
        )

        try {
            activity?.getSharedPreferences("config", MODE_PRIVATE)?.run {
                if (!getBoolean("new", false)) {
                    edit().putBoolean("new", true).apply()
                    AlertDialog.Builder(context!!)
                        .setTitle("试验性功能 自定义成绩单、研究生成绩单 上线")
                        .setMessage("点击屏幕右上角三个点即可找到。\n应该还会再改改，所以如有问题和建议欢迎反馈，谢谢！")
                        .show()
                }

                if (mode == Mode.GRADUATE && !getBoolean("report_graduate", false)) {
                    edit().putBoolean("report_graduate", true).apply()
                    AlertDialog.Builder(context!!)
                        .setMessage("该APP对研究生的支持尚不完善，如有问题和建议欢迎反馈。\n研究生成绩单的网址是猜的，如果总是加载不出来，假如您有兴趣的话，不如反馈一下Info网站“中文成绩单”的网址，谢谢~")
                        .show()
                }

                if (mode == Mode.CUSTOM && !getBoolean("report_custom", false)) {
                    edit().putBoolean("report_custom", true).apply()
                    AlertDialog.Builder(context!!)
                        .setMessage("用法：水平滑动删除课程，使用页面底部的按钮切换模式。\n推出该功能的初衷是满足一些院系个性化成绩单的需求。请妥善使用。\n欢迎反馈改进意见~\n（目前仅支持本科生）")
                        .show()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        report_recycler_view.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ReportAdapter(listOf(), mode)
        }

        report_swipe_refresh.apply {
            isRefreshing = true
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { getData() }
        }

        if (mode == Mode.NORMAL) {
            (activity as? MainActivity)?.run {
                menu.removeItem(R.id.item_pay_for_report)
                menu.removeItem(R.id.report_bx_btn)
                menu.removeItem(R.id.report_custom_btn)
                menu.removeItem(R.id.report_graduate_btn)
                menuInflater.inflate(R.menu.pay_for_report_menu, menu)
            }
        }

        if (mode == Mode.CUSTOM) {
            report_toggle_state.run {
                visibility = View.VISIBLE
                setOnClickListener {
                    report_toggle_state.setText(if (customOriginal) R.string.report_view_hidden_str else R.string.report_view_original_str)
                    customOriginal = !customOriginal
                    (report_recycler_view.adapter as? ReportAdapter)?.toggle()
                }
            }

            ItemTouchHelper(object : ItemTouchHelper.Callback() {
                override fun getMovementFlags(recyclerView: RecyclerView, viewHolder: RecyclerView.ViewHolder) =
                    makeMovementFlags(0, ItemTouchHelper.START or ItemTouchHelper.END)

                override fun onMove(
                    recyclerView: RecyclerView,
                    viewHolder: RecyclerView.ViewHolder,
                    target: RecyclerView.ViewHolder
                ) = true

                override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {
                    val position = viewHolder.adapterPosition
                    if (direction == ItemTouchHelper.START || direction == ItemTouchHelper.END)
                        (report_recycler_view.adapter as? ReportAdapter)?.toggle(position)
                }
            }).attachToRecyclerView(report_recycler_view)
        }

        getData()
    }

    enum class Mode { NORMAL, BX, CUSTOM, GRADUATE }

    override fun onPause() {
        super.onPause()

        if (mode == Mode.NORMAL) {
            (activity as? MainActivity)?.menu?.run {
                removeItem(R.id.item_pay_for_report)
                removeItem(R.id.report_bx_btn)
                removeItem(R.id.report_custom_btn)
                removeItem(R.id.report_graduate_btn)
            }
        }
    }
}