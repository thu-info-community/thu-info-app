package com.unidy2002.thuinfo.ui.report

import android.content.Context
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import cn.leancloud.AVOSCloud
import cn.leancloud.AVObject
import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONArray
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getData
import com.unidy2002.thuinfo.data.util.appId
import com.unidy2002.thuinfo.data.util.appKey
import com.unidy2002.thuinfo.data.util.safeThread
import com.unidy2002.thuinfo.data.util.serverURL
import io.reactivex.Observer
import io.reactivex.disposables.Disposable
import kotlinx.android.synthetic.main.activity_report.*

class ReportActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_report)

        try {
            setSupportActionBar(bug_report_tool_bar)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        try {
            getSharedPreferences("config", MODE_PRIVATE)?.run {
                if (!getBoolean("popi_report_intro", false)) {
                    edit().putBoolean("popi_report_intro", true).apply()
                    android.app.AlertDialog.Builder(this@ReportActivity)
                        .setTitle("反馈模块启用匿名提问箱模式")
                        .setMessage("我们看到您的问题后，会尽快给出答复，并放入提问箱。\n如果你的反馈中含有个人信息，我们会先将其隐去。")
                        .show()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        try {
            AVOSCloud.initialize(this, appId, appKey, serverURL)

            bug_report_submit.setOnClickListener {
                try {
                    bug_report_submit.isEnabled = false
                    AVObject("Report").run {
                        put("api", android.os.Build.VERSION.SDK_INT)
                        put("message", bug_report_input.text.toString())
                        saveInBackground().subscribe(object : Observer<AVObject> {
                            override fun onComplete() {
                                Toast.makeText(this@ReportActivity, R.string.bug_report_succeed, Toast.LENGTH_SHORT)
                                    .show()
                            }

                            override fun onSubscribe(d: Disposable) {}
                            override fun onNext(t: AVObject) {}

                            override fun onError(e: Throwable) {
                                e.printStackTrace()
                                Toast.makeText(this@ReportActivity, R.string.bug_report_fail, Toast.LENGTH_SHORT).show()
                                bug_report_submit.isEnabled = true
                            }
                        })
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    Toast.makeText(this, R.string.bug_report_fail, Toast.LENGTH_SHORT).show()
                    bug_report_submit.isEnabled = true
                }
            }

            bug_report_input.addTextChangedListener(object : TextWatcher {
                override fun afterTextChanged(s: Editable) {
                    bug_report_submit.isEnabled = s.isNotBlank()
                }

                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            })

        } catch (e: Exception) {
            e.printStackTrace()
            try {
                Toast.makeText(this, R.string.bug_report_exception_string, Toast.LENGTH_LONG).show()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        report_popi_btn.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle(R.string.popi_string)
                .setView(object : LinearLayout(this) {
                    init {
                        (getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
                            .inflate(R.layout.layout_popi, this, true).run {
                                val recycler = findViewById<RecyclerView>(R.id.popi_list)

                                safeThread {
                                    val result = JSON.parseArray(
                                        Network.connect("https://cloud.tsinghua.edu.cn/f/2187997c76544445ad0f/?dl=1")
                                            .getData()
                                    ).map {
                                        it as JSONArray
                                        it[0] as String to it[1] as String
                                    }
                                    handler.post {
                                        recycler.layoutManager = LinearLayoutManager(this@ReportActivity)
                                        recycler.adapter = PopiList(result)
                                    }
                                }
                            }

                    }
                })
                .show()
        }
    }

    private inner class PopiList(val result: List<Pair<String, String>>) :
        RecyclerView.Adapter<RecyclerView.ViewHolder>() {
        private inner class Holder(view: View) : RecyclerView.ViewHolder(view) {
            val question: TextView = view.findViewById(R.id.popi_question_text)
            val answer: TextView = view.findViewById(R.id.popi_answer_text)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = Holder(
            LayoutInflater.from(parent.context)
                .inflate(R.layout.item_popi_card, parent, false)
        )

        override fun getItemCount() = result.size

        override fun onBindViewHolder(
            holder: RecyclerView.ViewHolder,
            position: Int
        ) {
            holder as Holder
            holder.question.text = result[position].first
            holder.answer.text = result[position].second
        }
    }

    override fun onSupportNavigateUp() = finish().run { true }
}