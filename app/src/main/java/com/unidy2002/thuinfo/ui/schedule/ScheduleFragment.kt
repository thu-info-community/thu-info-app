package com.unidy2002.thuinfo.ui.schedule

import android.os.Bundle
import android.os.Handler
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.GridLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.Network
import com.unidy2002.thuinfo.data.model.LoggedInUser
import com.unidy2002.thuinfo.ui.login.LoginActivity
import java.sql.Date
import java.text.SimpleDateFormat
import java.util.*
import kotlin.concurrent.thread


class ScheduleFragment : Fragment() {

    private lateinit var scheduleViewModel: ScheduleViewModel

    private val loggedInUser: LoggedInUser
        get() = LoginActivity.loginViewModel.getLoggedInUser()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        scheduleViewModel =
            ViewModelProvider(this).get(ScheduleViewModel::class.java)
        return inflater.inflate(R.layout.fragment_schedule, container, false)
    }

    private fun updateUI() {
        val mon = Date.valueOf("2019-09-16")
        val tue = Date.valueOf("2019-09-17")
        val gridLayout = view?.findViewById<GridLayout>(R.id.table_grid)!!
        val day = tue!!.time - mon!!.time
        val width = view?.findViewById<TextView>(R.id.content)!!.width
        val simpleDateFormat = SimpleDateFormat("MM.dd", Locale.CHINA)
        for (c in 1..7) {
            var last = 0
            loggedInUser.personalCalendar.lessonList.filter { it.date.time == mon.time + (c - 1) * day }.forEach {
                if (it.begin - last > 1) {
                    val textView = TextView(context)
                    textView.text = ""
                    textView.width = width
                    val layoutParams = GridLayout.LayoutParams()
                    layoutParams.rowSpec = GridLayout.spec(last + 1, it.begin - last - 1, GridLayout.FILL)
                    layoutParams.columnSpec = GridLayout.spec(c)
                    gridLayout.addView(textView, layoutParams)
                }
                val textView = TextView(context)
                textView.text = getString(R.string.abbr_locale, it.abbr, it.locale)
                textView.width = width
                textView.gravity = Gravity.CENTER
                textView.isSingleLine = false
                textView.setBackgroundColor(
                    resources.getIntArray(R.array.schedule_colors)[loggedInUser.personalCalendar.colorMap[it.title] ?: 0]
                )
                val layoutParams = GridLayout.LayoutParams()
                layoutParams.rowSpec = GridLayout.spec(it.begin, it.end - it.begin + 1, GridLayout.FILL)
                layoutParams.columnSpec = GridLayout.spec(c, GridLayout.FILL)
                gridLayout.addView(textView, layoutParams)
                last = it.end
            }
            if (last < 14) {
                val textView = TextView(context)
                textView.text = ""
                textView.width = width
                val layoutParams = GridLayout.LayoutParams()
                layoutParams.rowSpec = GridLayout.spec(last + 1, 14 - last, GridLayout.FILL)
                layoutParams.columnSpec = GridLayout.spec(c)
                gridLayout.addView(textView, layoutParams)
            }
            val textView = TextView(context)
            textView.text = getString(
                R.string.double_line,
                resources.getStringArray(R.array.weeks)[c - 1],
                simpleDateFormat.format(Date(mon.time + (c - 1) * day))
            )
            textView.width = width
            textView.gravity = Gravity.CENTER
            val layoutParams = GridLayout.LayoutParams()
            layoutParams.rowSpec = GridLayout.spec(0, GridLayout.FILL)
            layoutParams.columnSpec = GridLayout.spec(c)
            gridLayout.addView(textView, layoutParams)
        }

        view?.findViewById<ProgressBar>(R.id.loading)?.visibility = ProgressBar.GONE
    }

    private val handler = Handler()

    override fun onStart() {
        super.onStart()
        thread(start = true) {
            Network().getCalender(context!!)
            if (loggedInUser.calenderInitialized()) {
                handler.post { updateUI() }
            }
        }
    }
}