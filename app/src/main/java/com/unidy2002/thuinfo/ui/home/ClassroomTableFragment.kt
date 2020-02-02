package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.os.Handler
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.util.Network
import com.unidy2002.thuinfo.data.model.classroom.ClassroomTableAdapter
import com.unidy2002.thuinfo.data.util.SchoolCalendar
import kotlin.concurrent.thread

class ClassroomTableFragment : Fragment() {
    private var prev: List<Pair<String, List<Int>>>? = null
    private var curr: List<Pair<String, List<Int>>>? = null
    private var next: List<Pair<String, List<Int>>>? = null
    private var loadingState = MutableList(19) { false }
    private var currentWeek = 1
    private var currentDay = 0
    private lateinit var classroom: String
    private val weekInChinese = listOf("周一", "周二", "周三", "周四", "周五", "周六", "周日")

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_classroom_table, container, false)

    private val handler = Handler()

    private fun updateUI() {
        val classroomTableView = view?.findViewById<RecyclerView>(R.id.classroom_table_view)
        curr?.run {
            classroomTableView?.adapter =
                ClassroomTableAdapter(
                    this,
                    context!!.resources.getIntArray(R.array.classroom_colors).toList(),
                    currentDay
                )
        }
        view?.findViewById<TextView>(R.id.classroom_date)?.text =
            getString(R.string.classroom_header_string, currentWeek, weekInChinese[currentDay])
        view?.findViewById<SwipeRefreshLayout>(R.id.classroom_swipe_refresh)?.isRefreshing = false
    }

    private fun getData(increment: Int) {
        val currentLoading = currentWeek + increment
        if (currentLoading in 1..18 && !loadingState[currentLoading]) {
            loadingState[currentLoading] = true
            val data = Network().getClassroomState(classroom, currentLoading)
            if (currentLoading == currentWeek + increment) {
                when (increment) {
                    0 -> curr = data
                    1 -> next = data
                    -1 -> prev = data
                }
            }
            loadingState[currentLoading] = false
        }
    }

    private fun initialize() {
        thread(start = true) {
            getData(0)
            handler.post { updateUI() }
            thread(start = true) { getData(1) }
            thread(start = true) { getData(-1) }
        }
    }

    override fun onStart() {
        classroom = arguments!!.getString("name")!!
        (activity as AppCompatActivity).supportActionBar?.title = arguments!!.getString("title")!!

        val today = SchoolCalendar()
        when {
            today.weekNumber > 18 -> {
                currentWeek = 18
                currentDay = 6
            }
            today.weekNumber > 0 -> {
                currentWeek = today.weekNumber
                currentDay = today.dayOfWeek
            }
            else -> {
                currentWeek = 1
                currentDay = 0
            }
        }

        view?.findViewById<RecyclerView>(R.id.classroom_table_view)?.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ClassroomTableAdapter(
                listOf(),
                listOf(),
                0
            )
        }

        view?.findViewById<SwipeRefreshLayout>(R.id.classroom_swipe_refresh)?.apply {
            isRefreshing = true
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { initialize() }
        }

        val minusButton = view?.findViewById<Button>(R.id.classroom_minus)
        val plusButton = view?.findViewById<Button>(R.id.classroom_plus)

        minusButton?.setOnClickListener {
            if (currentDay == 0) {
                if (currentWeek > 1) {
                    currentWeek--
                    currentDay = 6
                    if (prev == null) {
                        initialize()
                    } else {
                        next = curr
                        curr = prev
                        updateUI()
                        thread(start = true) { getData(-1) }
                    }
                }
            } else {
                currentDay--
                minusButton.isEnabled = !(currentWeek == 1 && currentDay == 0)
                updateUI()
            }
            plusButton?.isEnabled = !(currentWeek == 18 && currentDay == 6)
        }
        minusButton?.isEnabled = !(currentWeek == 1 && currentDay == 0)

        plusButton?.setOnClickListener {
            if (currentDay == 6) {
                if (currentWeek < 18) {
                    currentWeek++
                    currentDay = 0
                    if (next == null) {
                        initialize()
                    } else {
                        prev = curr
                        curr = next
                        updateUI()
                        thread(start = true) { getData(1) }
                    }
                }
            } else {
                currentDay++
                plusButton.isEnabled = !(currentWeek == 18 && currentDay == 6)
                updateUI()
            }
            minusButton?.isEnabled = !(currentWeek == 1 && currentDay == 0)
        }
        plusButton?.isEnabled = !(currentWeek == 18 && currentDay == 6)

        initialize()
        super.onStart()
    }
}