package com.unidy2002.thuinfo.ui.schedule

import android.R.layout.simple_spinner_dropdown_item
import android.app.AlertDialog
import android.content.Context
import android.os.Bundle
import android.view.Gravity.CENTER
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import android.widget.GridLayout.*
import androidx.annotation.StringRes
import androidx.fragment.app.Fragment
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.NavHostFragment
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.schedule.Schedule
import com.unidy2002.thuinfo.data.util.SchoolCalendar
import com.unidy2002.thuinfo.data.util.save
import com.unidy2002.thuinfo.data.util.toBitmap
import java.text.SimpleDateFormat
import java.util.*
import kotlin.concurrent.thread
import kotlin.math.round


// TODO: the schedule module is definitely to be reconstructed


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
                    view?.findViewById<Button>(R.id.schedule_custom_add)?.isEnabled = true
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
                view?.findViewById<Button>(R.id.schedule_custom_add)?.isEnabled = true
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
                    context!!, getString(schedule_title_template, scheduleViewModel.scheduleWeek.value)
                )
                Toast.makeText(context, save_to_gallery_succeed, Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                e.printStackTrace()
                try {
                    Toast.makeText(context, save_fail_string, Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        view?.findViewById<Button>(R.id.schedule_custom_add)?.setOnClickListener {
            activity?.run a@{
                val popup = ScheduleCustomAddLayout(this)
                AlertDialog.Builder(this)
                    .setTitle(custom_add_string)
                    .setView(popup)
                    .setPositiveButton(confirm_string) { dialog, _ ->
                        try {
                            dialog::class.java.superclass?.getDeclaredField("mShowing")?.run {
                                isAccessible = true
                                val info = popup.valid
                                if (info == null) {
                                    popup.weeks.forEach {
                                        scheduleViewModel.addCustom(
                                            Schedule.Lesson(
                                                popup.title,
                                                popup.locale,
                                                Date(SchoolCalendar(it, popup.dayOfWeek).timeInMillis),
                                                popup.range.first,
                                                popup.range.second
                                            )
                                        )
                                    }
                                    set(dialog, true)
                                } else {
                                    context?.run { Toast.makeText(this, info, Toast.LENGTH_SHORT).show() }
                                    set(dialog, false)
                                }
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                    .setNegativeButton(cancel_string) { dialog, _ ->
                        try {
                            dialog::class.java.superclass?.getDeclaredField("mShowing")?.run {
                                isAccessible = true
                                set(dialog, true)
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                    .setOnCancelListener { dialog ->
                        try {
                            dialog::class.java.superclass?.getDeclaredField("mShowing")?.run {
                                isAccessible = true
                                set(dialog, true)
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                    .show()
            }
        }
    }

    private fun updateUI(schedule: Schedule) {
        scheduleViewModel.scheduleWeek.value?.run weekNumber@{
            val date = SchoolCalendar(this, 1)
            val today = SchoolCalendar()

            view?.run {
                findViewById<TextView>(R.id.schedule_title).text = getString(week_title, this@weekNumber)

                val grid = findViewById<GridLayout>(R.id.table_grid)
                val totalWidth = findViewById<LinearLayout>(R.id.schedule_content).width
                val stdWidth = round(totalWidth / 7.6).toInt()
                val remainderWidth = totalWidth - stdWidth * 7
                grid.removeAllViews()

                fun addView(title: String, color: Int? = null, begin: Int = 0, size: Int = 1, useStd: Boolean = true) {
                    try {
                        grid.addView(TextView(context).apply {
                            text = title
                            width = if (useStd) stdWidth else remainderWidth
                            if (!useStd) height = 130
                            gravity = CENTER
                            color?.run { setBackgroundColor(resources.getIntArray(R.array.schedule_colors)[color]) }
                            if (begin == 0 && date == today)
                                setTextColor(resources.getColor(R.color.colorAccent, null))
                        }, LayoutParams().apply {
                            rowSpec = spec(begin, size, FILL)
                            columnSpec = spec(if (useStd) date.dayOfWeek else 0, FILL, 1f)
                        })
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                for (i in 1..14) addView(i.toString(), begin = i, useStd = false)

                repeat(7) {
                    addView(
                        getString(
                            double_line,
                            resources.getStringArray(R.array.weeks)[date.dayOfWeek],
                            SimpleDateFormat("MM.dd", Locale.CHINA).format(date.timeInMillis)
                        )
                    )
                    schedule.allLessonList.filter { it.date.time == date.timeInMillis }.forEach {
                        addView(
                            if (it.locale.isEmpty())
                                schedule.abbr(it.title)
                            else
                                getString(abbr_locale, schedule.abbr(it.title), it.locale),
                            schedule.getColor(it.title),
                            it.begin,
                            it.end - it.begin + 1
                        )
                    }
                    date.add(Calendar.DATE, 1)
                }
            }
        }
    }

    internal class ScheduleCustomAddLayout(context: Context) : LinearLayout(context) {
        private val titleView: EditText?
        private val localeView: EditText?
        private val dayOfWeekView: Spinner?
        private val beginView: EditText?
        private val endView: EditText?
        private val repeatView: Spinner?
        private val repeatCustomView: EditText?
        private val includeExamView: CheckBox?

        init {
            (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
                .inflate(R.layout.item_add_popup, this, true)
                .run {
                    titleView = findViewById(R.id.schedule_add_title)
                    localeView = findViewById(R.id.schedule_add_locale)
                    dayOfWeekView = findViewById(R.id.schedule_day_spinner)
                    beginView = findViewById(R.id.schedule_begin)
                    endView = findViewById(R.id.schedule_end)
                    repeatView = findViewById(R.id.schedule_repeat_spinner)
                    repeatCustomView = findViewById(R.id.schedule_repeat_custom)
                    includeExamView = findViewById(R.id.schedule_repeat_include_exam)

                    dayOfWeekView?.adapter = ArrayAdapter(
                        context, simple_spinner_dropdown_item,
                        resources.getStringArray(R.array.weeks).drop(1)
                    )

                    repeatView?.adapter = ArrayAdapter(
                        context, simple_spinner_dropdown_item,
                        resources.getStringArray(R.array.week_repeat_types)
                    )

                    repeatView?.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                        override fun onNothingSelected(parent: AdapterView<*>?) {}

                        override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                            repeatCustomView?.isEnabled = position == 3
                            includeExamView?.isEnabled = position != 3
                        }
                    }
                }

        }

        private fun parseCustom(): List<Int>? {
            if (repeatCustomView == null || repeatCustomView.text.isBlank()) return null
            val result = mutableSetOf<Int>()
            repeatCustomView.text.toString().replace(Regex("\\s"), "").split(',').forEach {
                when {
                    it.matches(Regex("[0-9]+")) ->
                        with(it.toInt()) { if (this in 1..18) result.add(this) else return null }
                    it.matches(Regex("[0-9]+-[0-9]+")) ->
                        with(it.split('-')) {
                            val begin = this[0].toInt()
                            val end = this[1].toInt()
                            if (begin in 1..18 && end in 1..18 && begin <= end) result.addAll(begin..end)
                            else return null
                        }
                    else -> return null
                }
            }
            return result.toList()
        }

        private fun parseRange(): Pair<Int, Int>? {
            if (beginView == null || endView == null) return null
            val begin = beginView.text.toString().run { if (isBlank()) 1 else toInt() }
            val end = endView.text.toString().run { if (isBlank()) 14 else toInt() }
            return if (begin in 1..14 && end in 1..14 && begin <= end) begin to end else null
        }

        val valid
            @StringRes get() = when {
                (titleView?.text ?: "").isBlank() -> please_input_name
                parseRange() == null -> schedule_range_invalid_string
                repeatView?.selectedItemPosition == 3 && (repeatCustomView?.text ?: "").isBlank() -> input_custom
                repeatView?.selectedItemPosition == 3 && parseCustom() == null -> input_custom_invalid
                else -> null
            }

        val title get() = titleView?.text?.toString()?.trim() ?: ""

        val locale get() = localeView?.text?.toString()?.trim() ?: ""

        val dayOfWeek get() = (dayOfWeekView?.selectedItemPosition ?: 0) + 1

        val range get() = parseRange() ?: (1 to 14)

        val weeks
            get() = when (repeatView?.selectedItemPosition) {
                0 -> if (includeExamView?.isChecked == true) 1..18 else 1..16
                1 -> List(if (includeExamView?.isChecked == true) 9 else 8) { it * 2 + 1 }
                2 -> List(if (includeExamView?.isChecked == true) 9 else 8) { it * 2 + 2 }
                3 -> parseCustom() ?: 1..16
                else -> 1..16
            }
    }
}