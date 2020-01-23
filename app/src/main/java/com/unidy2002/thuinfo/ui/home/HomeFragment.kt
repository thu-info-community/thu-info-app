package com.unidy2002.thuinfo.ui.home

import android.app.AlertDialog
import android.os.Bundle
import android.os.Handler
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProviders
import androidx.navigation.fragment.NavHostFragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.Network
import com.unidy2002.thuinfo.ui.login.LoginActivity
import kotlin.concurrent.thread

class HomeFragment : Fragment() {

    private lateinit var homeViewModel: HomeViewModel

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        homeViewModel = ViewModelProviders.of(this).get(HomeViewModel::class.java)
        return inflater.inflate(R.layout.fragment_home, container, false)
    }

    private val handler = Handler()

    override fun onStart() {
        view?.findViewById<Button>(R.id.report_btn)?.setOnClickListener {
            NavHostFragment.findNavController(this)
                .navigate(R.id.reportFragment)
        }
        view?.findViewById<Button>(R.id.physical_exam_btn)?.setOnClickListener {
            NavHostFragment.findNavController(this)
                .navigate(R.id.physicalExamFragment)
        }
        view?.findViewById<Button>(R.id.jogging_btn)?.setOnClickListener {
            NavHostFragment.findNavController(this)
                .navigate(R.id.joggingTableFragment)
        }
        view?.findViewById<Button>(R.id.classroom_btn)?.setOnClickListener {
            NavHostFragment.findNavController(this)
                .navigate(R.id.classroomWelcomeFragment)
        }
        view?.findViewById<Button>(R.id.ecard_query_btn)?.setOnClickListener {
            NavHostFragment.findNavController(this)
                .navigate(R.id.eCardTableFragment)
        }
        view?.findViewById<Button>(R.id.lose_card_btn)?.setOnClickListener {
            AlertDialog.Builder(view?.context!!)
                .setTitle("您确定要挂失吗？")
                .setMessage("该操作无法撤销。")
                .setPositiveButton("确定") { _, _ ->
                    thread(start = true) {
                        val result = Network().loseCard()
                        handler.post {
                            Log.i("LOSE CARD CODE", result.toString())
                            when (result) {
                                2 -> Toast.makeText(context, "挂失成功！", Toast.LENGTH_LONG).show()
                                4 -> AlertDialog.Builder(context).setTitle("请不要重复挂失").setMessage("您的卡片已经处于挂失状态。").show()
                                5 -> AlertDialog.Builder(context).setTitle("一卡通服务端异常[错误代码：5]").setMessage("卡片状态无效，无法挂失！").show()
                                -1 -> AlertDialog.Builder(context).setTitle("一卡通服务端异常[错误代码：-1]").setMessage("挂失处理失败，没有此卡信息！").show()
                                -2 -> AlertDialog.Builder(context).setTitle("一卡通服务端异常[错误代码：-2]").setMessage("挂失处理失败，此卡有效期错误！").show()
                                -100 -> AlertDialog.Builder(context).setTitle("一卡通服务端异常[错误代码：-100]").setMessage("挂失处理失败，数据库错误！").show()
                                7 -> AlertDialog.Builder(context).setTitle("一卡通服务端异常[错误代码：7]").setMessage("挂失处理失败，挂失服务异常！").show()
                                null -> Toast.makeText(context, "挂失失败，请稍后重试。", Toast.LENGTH_LONG).show()
                                else -> AlertDialog.Builder(context).setTitle("一卡通服务端异常[错误代码：$result]").setMessage("挂失处理失败，未知错误！").show()
                            }
                        }
                    }
                }
                .setNegativeButton("取消") { _, _ -> }
                .show()
        }
        view?.findViewById<Button>(R.id.logout_btn)?.setOnClickListener {
            thread(start = true) {
                Network().logout()
                handler.post {
                    if (LoginActivity.loginViewModel.getLoggedInUser().rememberPassword) {
                        AlertDialog.Builder(view?.context!!)
                            .setTitle("是否清除记住的密码？")
                            .setPositiveButton("保留") { _, _ ->
                                activity?.finish()
                            }
                            .setNegativeButton("清除") { _, _ ->
                                val sharedPreferences =
                                    activity?.getSharedPreferences("UserId", AppCompatActivity.MODE_PRIVATE)!!.edit()
                                sharedPreferences.putString("remember", "false")
                                sharedPreferences.remove("username")
                                sharedPreferences.remove("password")
                                sharedPreferences.apply()
                                activity?.finish()
                            }
                            .setOnDismissListener {
                                activity?.finish()
                            }
                            .show()
                    } else {
                        activity?.finish()
                    }
                }
            }
        }
        super.onStart()
    }
}