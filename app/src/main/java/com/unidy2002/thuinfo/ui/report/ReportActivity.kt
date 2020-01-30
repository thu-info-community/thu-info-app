package com.unidy2002.thuinfo.ui.report

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import cn.leancloud.AVOSCloud
import cn.leancloud.AVObject
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.util.appId
import com.unidy2002.thuinfo.data.util.appKey
import com.unidy2002.thuinfo.data.util.serverURL
import io.reactivex.Observer
import io.reactivex.disposables.Disposable


class ReportActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_report)

        try {
            setSupportActionBar(findViewById(R.id.bug_report_tool_bar))
        } catch (e: Exception) {
            e.printStackTrace()
        }

        try {
            AVOSCloud.initialize(this, appId, appKey, serverURL)

            val button = findViewById<Button>(R.id.bug_report_submit)
            val editText = findViewById<EditText>(R.id.bug_report_input)

            button.setOnClickListener {
                try {
                    button.isEnabled = false
                    AVObject("Report").run {
                        put("api", android.os.Build.VERSION.SDK_INT)
                        put("message", editText.text.toString())
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
                                button.isEnabled = true
                            }
                        })
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    Toast.makeText(this, R.string.bug_report_fail, Toast.LENGTH_SHORT).show()
                    button.isEnabled = true
                }
            }

            editText.addTextChangedListener(object : TextWatcher {
                override fun afterTextChanged(s: Editable) {
                    button.isEnabled = s.isNotBlank()
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
    }

    override fun onSupportNavigateUp() = finish().run { true }
}