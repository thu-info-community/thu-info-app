package com.unidy2002.thuinfo.ui.schedule

import android.os.Bundle
import android.view.Gravity.CENTER
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import android.widget.GridLayout.*
import androidx.fragment.app.Fragment
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.NavHostFragment
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.schedule.Schedule
import com.unidy2002.thuinfo.data.util.SchoolCalendar
import com.unidy2002.thuinfo.data.util.save
import com.unidy2002.thuinfo.data.util.toBitmap
import java.text.SimpleDateFormat
import java.util.*
import kotlin.concurrent.thread
import kotlin.math.round


class ScheduleFragment : Fragment() {

    private lateinit var scheduleViewModel: ScheduleViewModel

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        scheduleViewModel = ViewModelProvider(this).get(ScheduleViewModel::class.java)
        return inflater.inflate(R.layout.fragment_schedule, container, false)
    }

    override fun onStart() {
        super.onStart()

        with(scheduleViewModel) {
            scheduleWeek.observe(this@ScheduleFragment, Observer {
                it?.run {
                    view?.findViewById<Button>(R.id.schedule_minus)?.isEnabled = this > 1
                    view?.findViewById<Button>(R.id.schedule_plus)?.isEnabled = this < SchoolCalendar.weekCount
                    thread { getData(context) }
                }
            })
            scheduleData.observe(this@ScheduleFragment, Observer {
                it?.run {
                    error?.run result@{ context?.run { Toast.makeText(this, this@result, Toast.LENGTH_SHORT).show() } }
                    success?.run { updateUI(this) }
                    view?.findViewById<SwipeRefreshLayout>(R.id.schedule_swipe_refresh)?.isRefreshing = false
                    view?.findViewById<Button>(R.id.schedule_custom_abbr)?.isEnabled = true
                    view?.findViewById<Button>(R.id.schedule_save_image)?.isEnabled = true
                }
            })
            scheduleWeek.value ?: setWeek(SchoolCalendar().weekNumber)
        }

        view?.findViewById<SwipeRefreshLayout>(R.id.schedule_swipe_refresh)?.apply {
            setColorSchemeResources(R.color.colorAccent)
            isRefreshing = true
            setOnRefreshListener {
                view?.findViewById<Button>(R.id.schedule_custom_abbr)?.isEnabled = false
                view?.findViewById<Button>(R.id.schedule_save_image)?.isEnabled = false
                thread { scheduleViewModel.getData(context, true) }
            }
        }

        view?.findViewById<TextView>(R.id.schedule_title)
            ?.setOnClickListener { scheduleViewModel.setWeek(SchoolCalendar().weekNumber) }

        view?.findViewById<Button>(R.id.schedule_minus)
            ?.setOnClickListener { scheduleViewModel.weekDecrease() }

        view?.findViewById<Button>(R.id.schedule_plus)
            ?.setOnClickListener { scheduleViewModel.weekIncrease() }

        view?.findViewById<Button>(R.id.schedule_custom_abbr)
            ?.setOnClickListener {
                NavHostFragment.findNavController(this).navigate(R.id.customizeFragment)
            }

        view?.findViewById<Button>(R.id.schedule_save_image)?.setOnClickListener {
            try {
                view!!.findViewById<GridLayout>(R.id.table_grid).toBitmap().save(
                    context!!, getString(R.string.schedule_title_template, scheduleViewModel.scheduleWeek.value)
                )
                Toast.makeText(context, R.string.save_to_gallery_succeed, Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                e.printStackTrace()
                try {
                    Toast.makeText(context, R.string.save_fail_string, Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    private fun updateUI(schedule: Schedule) {
        scheduleViewModel.scheduleWeek.value?.run weekNumber@{
            val date = SchoolCalendar(this, 1)
            val today = SchoolCalendar()

            view?.run {
                findViewById<TextView>(R.id.schedule_title).text = getString(R.string.week_title, this@weekNumber)

                val grid = findViewById<GridLayout>(R.id.table_grid)
                val totalWidth = findViewById<LinearLayout>(R.id.schedule_content).width
                val stdWidth = round(totalWidth / 7.6).toInt()
                val remainderWidth = totalWidth - stdWidth * 7
                grid.removeAllViews()

                fun addView(title: String, color: Int? = null, begin: Int = 0, size: Int = 1, useStd: Boolean = true) {
                    grid.addView(TextView(context).apply {
                        text = title
                        width = if (useStd) stdWidth else remainderWidth
                        if (!useStd) height = 130
                        gravity = CENTER
                        color?.run { setBackgroundColor(resources.getIntArray(R.array.schedule_colors)[color]) }
                        if (begin == 0 && date == today) setTextColor(
                            resources.getColor(
                                R.color.colorAccent,
                                null
                            )
                        )
                    }, LayoutParams().apply {
                        rowSpec = spec(begin, size, FILL)
                        columnSpec = spec(if (useStd) date.dayOfWeek else 0, FILL, 1f)
                    })
                }

                for (i in 1..14) addView(i.toString(), begin = i, useStd = false)

                repeat(7) {
                    addView(
                        getString(
                            R.string.double_line,
                            resources.getStringArray(R.array.weeks)[date.dayOfWeek],
                            SimpleDateFormat("MM.dd", Locale.CHINA).format(date.timeInMillis)
                        )
                    )
                    schedule.lessonList.filter { it.date.time == date.timeInMillis }.forEach {
                        addView(
                            getString(R.string.abbr_locale, schedule.abbr(it.title), it.locale),
                            schedule.colorMap[it.title] ?: 0,
                            it.begin,
                            it.end - it.begin + 1
                        )
                    }
                    date.add(Calendar.DATE, 1)
                }
            }
        }
    }
}