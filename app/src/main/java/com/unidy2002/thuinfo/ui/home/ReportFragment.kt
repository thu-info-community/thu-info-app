package com.unidy2002.thuinfo.ui.home

import android.app.AlertDialog
import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatActivity.MODE_PRIVATE
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.MainActivity
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.model.report.ReportAdapter
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getReport
import com.unidy2002.thuinfo.data.util.safePost
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_report.*


class ReportFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_report, container, false)

    private val state get() = loggedInUser.reportState

    private fun getData() {
        safeThread {
            val report = Network.getReport(state)
            view?.handler?.safePost {
                report ?: context?.run { Toast.makeText(this, R.string.timeout_retry, Toast.LENGTH_SHORT).show() }
                report_recycler_view.adapter = ReportAdapter(report ?: listOf(), state)
                report_swipe_refresh.isRefreshing = false
            }
        }
    }

    private fun render() {
        (activity as? AppCompatActivity)?.supportActionBar?.setTitle(
            when (state.mode) {
                Mode.CUSTOM -> R.string.report_custom_select_str
                Mode.MANAGE -> R.string.report_manage_str
                else -> if (state.undergraduate) R.string.report_under_str else R.string.report_graduate_str
            }
        )

        report_recycler_view.adapter = ReportAdapter(listOf(), state)
        report_swipe_refresh.isRefreshing = true

        if (state.mode == Mode.CUSTOM || state.mode == Mode.MANAGE) {
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

    override fun onStart() {
        super.onStart()

        /* try {
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
        } */

        report_recycler_view.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ReportAdapter(listOf(), state)
        }

        report_swipe_refresh.apply {
            isRefreshing = true
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { getData() }
        }

        (activity as? MainActivity)?.run {
            reportFragment = this@ReportFragment
            menu.removeItem(R.id.item_pay_for_report)
            menu.removeItem(R.id.report_setting_btn)
            menuInflater.inflate(R.menu.pay_for_report_menu, menu)
        }

        if (context?.getSharedPreferences(loggedInUser.userId, MODE_PRIVATE)?.contains("reportSetting") == false)
            setup(true)

        loggedInUser.reportState = State(
            context?.getSharedPreferences(loggedInUser.userId, MODE_PRIVATE)?.getInt("reportSetting", defaultState)
                ?: defaultState
        )

        render()
    }

    enum class Mode { NORMAL, BX, CUSTOM, MANAGE }

    data class State(
        val undergraduate: Boolean = true,
        val newGPA: Boolean = true,
        var mode: Mode = Mode.NORMAL
    ) {
        constructor(value: Int) : this(value >= 8, value % 8 >= 4, Mode.values()[value % 4]) // 12 by default

        fun toInt() = (if (undergraduate) 8 else 0) + (if (newGPA) 4 else 0) + mode.ordinal
    }

    private val defaultState = 12

    override fun onPause() {
        super.onPause()

        (activity as? MainActivity)?.menu?.run {
            removeItem(R.id.item_pay_for_report)
            removeItem(R.id.report_setting_btn)
        }
    }

    fun setup(firstTime: Boolean = false) {
        try {
            val input = ReportSettingView(state.toInt())
            AlertDialog.Builder(context)
                .setTitle(R.string.report_setting_str)
                .setView(input)
                .setPositiveButton(R.string.confirm_string) { _, _ ->
                    try {
                        loggedInUser.reportState = State(input.choice.also {
                            context?.getSharedPreferences(loggedInUser.userId, MODE_PRIVATE)?.edit()
                                ?.putInt("reportSetting", it)?.commit()
                        })
                        render()
                        if (firstTime) {
                            Toast.makeText(context, R.string.report_first_time, Toast.LENGTH_SHORT).show()
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        Toast.makeText(context, R.string.report_exception_retry, Toast.LENGTH_SHORT).show()
                    }
                }
                .show()
        } catch (e: Exception) {
            e.printStackTrace()
            context?.run { Toast.makeText(this, R.string.report_exception_retry, Toast.LENGTH_SHORT).show() }
        }
    }

    private inner class SelectGroup(items: List<TextView>, var focus: Int = 0) {
        init {
            context?.run {
                items.forEachIndexed { index, textView ->
                    textView.setOnClickListener { v ->
                        items.forEach { innerIt ->
                            innerIt.background = getDrawable(R.drawable.report_setting_unselect)
                        }
                        v.background = getDrawable(R.drawable.report_setting_select)
                        focus = index
                    }
                }
                items.forEach { innerIt ->
                    innerIt.background = getDrawable(R.drawable.report_setting_unselect)
                }
                items[focus].background = getDrawable(R.drawable.report_setting_select)
            }
        }
    }

    private inner class ReportSettingView(initState: Int) : LinearLayout(context) {
        val selectGroups = (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
            .inflate(R.layout.item_report_setting, this, true).run {
                listOf(
                    SelectGroup(
                        listOf(
                            findViewById(R.id.report_select_undergraduate),
                            findViewById(R.id.report_select_graduate)
                        ),
                        1 - initState / 8
                    ),
                    SelectGroup(
                        listOf(
                            findViewById(R.id.report_select_new),
                            findViewById(R.id.report_select_oid)
                        ),
                        1 - (initState % 8) / 4
                    ),
                    SelectGroup(
                        listOf(
                            findViewById(R.id.report_select_bxr),
                            findViewById(R.id.report_select_bx),
                            findViewById(R.id.report_select_custom),
                            findViewById(R.id.report_select_manage)
                        ),
                        initState % 4
                    )
                )
            }

        val choice get() = (1 - selectGroups[0].focus) * 8 + (1 - selectGroups[1].focus) * 4 + selectGroups[2].focus
    }
}