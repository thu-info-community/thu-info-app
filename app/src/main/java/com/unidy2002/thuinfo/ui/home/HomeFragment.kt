package com.unidy2002.thuinfo.ui.home

import android.app.AlertDialog
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.NavHostFragment.findNavController
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getEleRechargePayCode
import com.unidy2002.thuinfo.data.network.loseCard
import com.unidy2002.thuinfo.data.util.Alipay
import kotlin.concurrent.thread


class HomeFragment : Fragment() {

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_home, container, false)

    override fun onStart() {
        view?.run {
            findViewById<TextView>(R.id.classroom_btn)?.setOnClickListener {
                findNavController(this@HomeFragment).navigate(R.id.classroomWelcomeFragment)
            }
            findViewById<TextView>(R.id.wentu_btn)?.setOnClickListener {
                findNavController(this@HomeFragment).navigate(R.id.wentuFragment)
            }
            findViewById<TextView>(R.id.report_btn)?.setOnClickListener {
                findNavController(this@HomeFragment).navigate(R.id.reportFragment)
            }
            findViewById<TextView>(R.id.physical_exam_btn)?.setOnClickListener {
                findNavController(this@HomeFragment).navigate(R.id.physicalExamFragment)
            }
            findViewById<TextView>(R.id.jogging_btn)?.setOnClickListener {
                findNavController(this@HomeFragment).navigate(R.id.joggingTableFragment)
            }
            findViewById<TextView>(R.id.e_card_query_btn)?.setOnClickListener {
                findNavController(this@HomeFragment).navigate(R.id.eCardTableFragment)
            }
            findViewById<TextView>(R.id.lose_card_btn)?.setOnClickListener {
                AlertDialog.Builder(context)
                    .setTitle(confirm_lose_card)
                    .setMessage(op_cannot_undo)
                    .setPositiveButton(positive_confirm_string) { _, _ ->
                        thread {
                            val result = Network.loseCard()
                            handler.post {
                                Log.i("LOSE CARD CODE", result.toString())
                                when (result) {
                                    2 -> Toast.makeText(context, 挂失成功, Toast.LENGTH_LONG).show()
                                    4 -> AlertDialog.Builder(context).setTitle(请不要重复挂失).setMessage(您的卡片已经处于挂失状态).show()
                                    5 -> AlertDialog.Builder(context).setTitle(一卡通服务端异常5).setMessage(卡片状态无效无法挂失).show()
                                    -1 -> AlertDialog.Builder(context).setTitle(一卡通服务端异常_1).setMessage(挂失处理失败没有此卡信息)
                                        .show()
                                    -2 -> AlertDialog.Builder(context).setTitle(一卡通服务端异常_2).setMessage(挂失处理失败此卡有效期错误)
                                        .show()
                                    -100 -> AlertDialog.Builder(context).setTitle(一卡通服务端异常_100).setMessage(挂失处理失败数据库错误)
                                        .show()
                                    7 -> AlertDialog.Builder(context).setTitle(一卡通服务端异常7).setMessage(挂失处理失败挂失服务异常)
                                        .show()
                                    null -> Toast.makeText(context, 挂失失败请稍后重试, Toast.LENGTH_LONG).show()
                                    else -> AlertDialog.Builder(context).setTitle(
                                        getString(一卡通服务端异常, result)
                                    ).setMessage(挂失处理失败未知错误).show()
                                }
                            }
                        }
                    }
                    .setNegativeButton(cancel_string) { _, _ -> }
                    .show()
            }
            findViewById<TextView>(R.id.dorm_ele_recharge_btn)?.setOnClickListener {
                configureCommunity {
                    try {
                        if (Alipay.hasInstalledAlipayClient(context)) {
                            val eleRechargeConfigLayout = EleRechargeConfigLayout(context)
                            AlertDialog.Builder(context)
                                .setTitle(dorm_ele_recharge_string)
                                .setView(eleRechargeConfigLayout)
                                .setCancelable(false)
                                .show()
                                .run {
                                    var thread: Thread? = null
                                    eleRechargeConfigLayout.apply {
                                        setOnConfirmListener(object : EleRechargeConfigLayout.OnConfirmListener {
                                            private fun showFailure() {
                                                try {
                                                    handler.post {
                                                        Toast.makeText(context, op_fail_retry, Toast.LENGTH_SHORT)
                                                            .show()
                                                        revokeLabel()
                                                    }
                                                } catch (e: Exception) {
                                                    e.printStackTrace()
                                                }
                                            }

                                            override fun onConfirm(value: Int) {
                                                thread = thread {
                                                    with(Network.getEleRechargePayCode(value)) code@{
                                                        if (this == null) {
                                                            showFailure()
                                                        } else {
                                                            activity?.run {
                                                                handler?.post {
                                                                    if (Alipay.startAlipayClient(this, this@code)) {
                                                                        dismiss()
                                                                    } else {
                                                                        showFailure()
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        })
                                        setOnCancelListener(object : EleRechargeConfigLayout.OnCancelListener {
                                            override fun onCancel() {
                                                thread?.interrupt()
                                                dismiss()
                                            }
                                        })
                                    }
                                }
                        } else {
                            context?.run {
                                Toast.makeText(this, require_alipay_string, Toast.LENGTH_SHORT).show()
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        try {
                            context?.run { Toast.makeText(this, load_fail_string, Toast.LENGTH_SHORT).show() }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }
            }
            findViewById<TextView>(R.id.dorm_laf_btn)?.setOnClickListener {
                findNavController(this@HomeFragment).navigate(R.id.lafMainFragment)
            }
            findViewById<TextView>(R.id.dorm_score_btn)?.setOnClickListener {
                configureCommunity {
                    findNavController(this@HomeFragment).navigate(R.id.dormScoreFragment)
                }
            }
        }
        super.onStart()
    }

    private fun configureCommunity(block: () -> Unit) {
        if (loggedInUser.communityLoggedIn) {
            block()
        } else {
            activity?.run {
                ViewModelProvider(this).get(ConfigureCommunityViewModel::class.java).setRunOnCallBack(block)
            }
            findNavController(this).navigate(R.id.configureCommunityFragment)
        }
    }
}