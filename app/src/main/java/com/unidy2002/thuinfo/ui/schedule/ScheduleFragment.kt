package com.unidy2002.thuinfo.ui.schedule

import android.R.layout.simple_spinner_dropdown_item
import android.app.AlertDialog
import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.view.Gravity.CENTER
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import android.widget.GridLayout.*
import androidx.annotation.StringRes
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.NavHostFragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.dao.ScheduleDBManager
import com.unidy2002.thuinfo.data.dao.ScheduleDBManager.Choice
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.util.SchoolCalendar
import com.unidy2002.thuinfo.data.util.safeThread
import com.unidy2002.thuinfo.data.util.save
import com.unidy2002.thuinfo.data.util.toBitmap
import kotlinx.android.synthetic.main.fragment_schedule.*
import java.util.*
import kotlin.math.round

class ScheduleFragment : Fragment() {

    private lateinit var scheduleViewModel: ScheduleViewModel
    private val sharedPreferences: SharedPreferences?
        get() = context?.getSharedPreferences(loggedInUser.userId, AppCompatActivity.MODE_PRIVATE)

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        scheduleViewModel = ViewModelProvider(this).get(ScheduleViewModel::class.java)
        return inflater.inflate(R.layout.fragment_schedule, container, false)
    }

    override fun onStart() {
        super.onStart()

        with(scheduleViewModel) {
            scheduleWeek.observe(this@ScheduleFragment, Observer {
                it?.run {
                    schedule_minus.isEnabled = this > 1
                    schedule_plus.isEnabled = this < SchoolCalendar.weekCount
                    safeThread { getData(sharedPreferences?.getBoolean("schedule", false) != true) }
                }
            })
            scheduleData.observe(this@ScheduleFragment, Observer {
                it?.run {
                    error?.run result@{ context?.run { Toast.makeText(this, this@result, Toast.LENGTH_SHORT).show() } }
                    success?.run {
                        updateUI(this)
                        sharedPreferences?.edit()?.putBoolean("schedule", true)?.apply()
                    }
                    schedule_swipe_refresh.isRefreshing = false
                    schedule_custom_abbr.isEnabled = true
                    schedule_save_image.isEnabled = true
                    schedule_custom_add.isEnabled = true
                    schedule_manage_hidden.isEnabled = true
                    schedule_secondary_switch.isEnabled = true
                }
            })
            scheduleWeek.value ?: setWeek(SchoolCalendar().weekNumber)
        }

        view?.run {
            schedule_swipe_refresh.apply {
                setColorSchemeResources(R.color.colorAccent)
                isRefreshing = true
                setOnRefreshListener {
                    schedule_custom_abbr.isEnabled = false
                    schedule_save_image.isEnabled = false
                    schedule_custom_add.isEnabled = false
                    schedule_manage_hidden.isEnabled = false
                    schedule_secondary_switch.isEnabled = false
                    safeThread { scheduleViewModel.getData(true) }
                }
            }

            schedule_title.setOnClickListener { scheduleViewModel.setWeek(SchoolCalendar().weekNumber) }

            schedule_minus.setOnClickListener { scheduleViewModel.weekDecrease() }

            schedule_plus.setOnClickListener { scheduleViewModel.weekIncrease() }

            schedule_custom_abbr.setOnClickListener {
                NavHostFragment.findNavController(this@ScheduleFragment)
                    .navigate(R.id.customizeFragment, Bundle().apply { putInt("mode", 1) })
            }

            schedule_save_image.setOnClickListener {
                try {
                    table_grid.toBitmap().save(
                        context, getString(schedule_title_template, scheduleViewModel.scheduleWeek.value)
                    )
                    context?.run { Toast.makeText(this, save_to_gallery_succeed, Toast.LENGTH_SHORT).show() }
                } catch (e: Exception) {
                    e.printStackTrace()
                    context?.run { Toast.makeText(this, save_fail_string, Toast.LENGTH_SHORT).show() }
                }
            }

            schedule_custom_add.setOnClickListener {
                activity?.run {
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
                                                ScheduleDBManager.Lesson(
                                                    popup.title,
                                                    popup.locale,
                                                    it,
                                                    popup.dayOfWeek,
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

            schedule_manage_hidden.setOnClickListener {
                NavHostFragment.findNavController(this@ScheduleFragment)
                    .navigate(R.id.customizeFragment, Bundle().apply { putInt("mode", 2) })
            }

            schedule_secondary_switch.setOnClickListener {
                AlertDialog.Builder(context)
                    .setTitle(secondary_courses_string)
                    .setMessage(secondary_requirement_string)
                    .setPositiveButton(not_now_string) { _, _ ->
                        loggedInUser.allowEnterCourseSelection = false
                    }
                    .setNegativeButton(allow_enter_string) { _, _ ->
                        loggedInUser.allowEnterCourseSelection = true
                    }
                    .setOnDismissListener {
                        safeThread {
                            sharedPreferences?.edit()
                                ?.putBoolean("enter_selection", loggedInUser.allowEnterCourseSelection)
                                ?.apply()
                        }
                    }
                    .setCancelable(false)
                    .show()
            }
        }
    }

    private fun updateUI(schedule: ScheduleDBManager) {
        scheduleViewModel.scheduleWeek.value?.run weekNumber@{
            val date = SchoolCalendar(this, 1)
            val today = SchoolCalendar()

            view?.run {
                schedule_title.text = getString(week_title, this@weekNumber)

                val stdWidth = round(schedule_content.width / 7.6).toInt()
                val remainderWidth = schedule_content.width - stdWidth * 7
                table_grid.removeAllViews()

                fun addView(
                    title: String,
                    color: Int? = null,
                    begin: Int = 0,
                    size: Int = 1,
                    day: Int = 0,
                    currentLesson: ScheduleDBManager.Session? = null,
                    lessonsToday: List<ScheduleDBManager.Session>? = null
                ) {
                    try {
                        table_grid.addView(TextView(context).apply {
                            text = title
                            width = if (day > 0) stdWidth else remainderWidth
                            if (day == 0) height = 130
                            gravity = CENTER
                            color?.run { setBackgroundColor(resources.getIntArray(R.array.schedule_colors)[color]) }
                            if (begin == 0 && today.weekNumber == this@weekNumber && today.dayOfWeek == day)
                                setTextColor(resources.getColor(R.color.colorAccent, null))
                            if (currentLesson != null && !lessonsToday.isNullOrEmpty())
                                setOnLongClickListener {
                                    val conflict = lessonsToday.filter {
                                        (it.begin in begin until begin + size ||
                                                it.end in begin until begin + size)
                                    }.toSet().sortedBy {
                                        if (it.type == currentLesson.type &&
                                            it.title == currentLesson.title &&
                                            it.begin == begin &&
                                            it.end == begin + size - 1
                                        ) 0 else 1
                                    }
                                    val solveConflict = ScheduleRadioGroup(context, conflict) {
                                        getString(lesson_brief_format, it.type.toString(), it.title, it.begin, it.end)
                                    }
                                    AlertDialog.Builder(context)
                                        .setTitle(you_chose_string)
                                        .setView(solveConflict)
                                        .setPositiveButton(confirm_string) { _, _ ->
                                            val intention = ScheduleRadioGroup(context, Choice.values().asList()) {
                                                getString(
                                                    when (solveConflict.choice.type) {
                                                        ScheduleDBManager.LessonType.CUSTOM -> when (it) {
                                                            Choice.ONCE -> delete_only_string
                                                            Choice.REPEAT -> delete_repeat_string
                                                            Choice.ALL -> delete_all_string
                                                        }
                                                        else -> when (it) {
                                                            Choice.ONCE -> hide_only_string
                                                            Choice.REPEAT -> hide_repeat_string
                                                            Choice.ALL -> hide_all_string
                                                        }
                                                    }
                                                )
                                            }
                                            AlertDialog.Builder(context)
                                                .setTitle(you_plan_string)
                                                .setView(intention)
                                                .setPositiveButton(confirm_string) { _, _ ->
                                                    scheduleViewModel.delOrHide(
                                                        intention.choice, solveConflict.choice
                                                    )
                                                }
                                                .setNegativeButton(cancel_string) { _, _ -> }
                                                .show()
                                        }
                                        .setNegativeButton(cancel_string) { _, _ -> }
                                        .show()
                                    true
                                }
                        }, LayoutParams().apply {
                            rowSpec = spec(begin, size, FILL)
                            columnSpec = spec(day, FILL, 1f)
                        })
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                for (i in 1..14) addView(i.toString(), begin = i)

                for (dayOfWeek in 1..7) {
                    addView(
                        getString(
                            schedule_date_format,
                            resources.getStringArray(R.array.weeks)[dayOfWeek],
                            date.get(Calendar.MONTH) + 1,
                            date.get(Calendar.DATE)
                        ),
                        day = dayOfWeek
                    )
                    val lessonsToday = schedule.taggedLessonList.filter {
                        it.week == this@weekNumber && it.dayOfWeek == dayOfWeek
                    }
                    lessonsToday.forEach {
                        addView(
                            if (it.locale.isEmpty())
                                schedule.abbr(it.title)
                            else
                                getString(abbr_locale, schedule.abbr(it.title), it.locale),
                            schedule.getColor(it.title),
                            it.begin,
                            it.end - it.begin + 1,
                            dayOfWeek,
                            it,
                            lessonsToday
                        )
                    }
                    date.add(Calendar.DATE, 1)
                }
            }
        }
    }

    private class ScheduleCustomAddLayout(context: Context) : LinearLayout(context) {
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

    private class ScheduleRadioGroup<T>(context: Context, src: List<T>, toText: (T) -> String) : LinearLayout(context) {
        var choice = src[0]

        init {
            (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
                .inflate(R.layout.item_radio_group, this, true)
                .findViewById<RadioGroup>(R.id.radio_group)
                .apply {
                    for ((index, item) in src.withIndex()) {
                        addView(RadioButton(context).apply {
                            id = index
                            text = toText(item)
                        })
                    }
                    check(0)
                    setOnCheckedChangeListener { _, id -> choice = src[id] }
                }
        }
    }
}