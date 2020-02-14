package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.classroom.ClassroomTableAdapter
import com.unidy2002.thuinfo.data.util.SchoolCalendar
import kotlin.concurrent.thread

class ClassroomTableFragment : Fragment() {
    private val dict = listOf("", "周一", "周二", "周三", "周四", "周五", "周六", "周日")
    private lateinit var viewModel: ClassroomTableViewModel

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        viewModel = ViewModelProvider(this).get(ClassroomTableViewModel::class.java)
        return inflater.inflate(R.layout.fragment_classroom_table, container, false)
    }

    override fun onStart() {
        super.onStart()

        arguments?.getString("name")?.run { viewModel.classroom = this }
        arguments?.getString("title")?.run { (activity as? AppCompatActivity)?.supportActionBar?.title = this }

        val minusButton = view?.findViewById<Button>(R.id.classroom_minus)
        val plusButton = view?.findViewById<Button>(R.id.classroom_plus)
        val recyclerView = view?.findViewById<RecyclerView>(R.id.classroom_table_view)
        val swipeRefreshLayout = view?.findViewById<SwipeRefreshLayout>(R.id.classroom_swipe_refresh)
        val title = view?.findViewById<TextView>(R.id.classroom_date)

        viewModel.apply {
            currentDay.observe(this@ClassroomTableFragment, Observer {
                it?.run day@{
                    currentWeek.value?.run week@{
                        minusButton?.isEnabled = !(this@day == 1 && this@week == 1)
                        plusButton?.isEnabled = !(this@day == 7 && this@week == SchoolCalendar.weekCount)
                        title?.text = getString(R.string.classroom_header_string, this@week, dict[this@day])
                        if (curr.value?.weekNumber == this@week) updateUI()
                    }
                }
            })

            currentWeek.observe(this@ClassroomTableFragment, Observer { it?.run { shiftData(this) } })

            curr.observe(this@ClassroomTableFragment, Observer {
                it?.run {
                    when (this.error) {
                        ClassroomTableViewModel.ClassroomErrorReason.CACHE_FAILURE -> {
                            swipeRefreshLayout?.isRefreshing = true
                            thread { viewModel.getData(0) }
                        }
                        ClassroomTableViewModel.ClassroomErrorReason.LOAD_FAILURE -> {
                            swipeRefreshLayout?.isRefreshing = false
                            context?.run { Toast.makeText(this, R.string.load_fail_string, Toast.LENGTH_SHORT).show() }
                        }
                        else -> {
                            swipeRefreshLayout?.isRefreshing = false
                            updateUI()
                        }
                    }
                }
            })

            setDate(SchoolCalendar())
        }

        recyclerView?.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = ClassroomTableAdapter(listOf(), listOf(), 0)
        }

        swipeRefreshLayout?.apply {
            isRefreshing = true
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener {
                isRefreshing = true
                viewModel.initialize()
            }
        }

        minusButton?.setOnClickListener { viewModel.dateDecrease() }

        plusButton?.setOnClickListener { viewModel.dateIncrease() }
    }

    private fun updateUI() {
        view?.findViewById<RecyclerView>(R.id.classroom_table_view)?.adapter =
            viewModel.curr.value?.success?.run result@{
                context?.run context@{
                    viewModel.currentDay.value?.run day@{
                        ClassroomTableAdapter(
                            this@result,
                            this@context.resources.getIntArray(R.array.classroom_colors).toList(),
                            this@day
                        )
                    }
                }
            }
    }
}