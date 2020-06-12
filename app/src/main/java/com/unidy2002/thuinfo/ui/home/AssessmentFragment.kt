package com.unidy2002.thuinfo.ui.home

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getAssessmentForm
import com.unidy2002.thuinfo.data.network.getAssessmentList
import com.unidy2002.thuinfo.data.network.postAssessmentForm
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_assessment.*

class AssessmentFragment : Fragment() {

    private var firstTime = true

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_assessment, container, false)

    private fun getData() {
        safeThread {
            val result = Network.getAssessmentList()
            assessment_swipe_refresh.isRefreshing = false
            assessment_swipe_refresh.handler.post {
                if (result == null)
                    context?.run { Toast.makeText(this, network_error_string, Toast.LENGTH_SHORT).show() }
                else
                    (assessment_recycler_view.adapter as AssessmentListAdapter).post(result)
            }
        }
    }

    override fun onStart() {
        super.onStart()

        if (firstTime) {
            AlertDialog.Builder(context)
                .setTitle(warning_string)
                .setMessage(assessment_warning_string)
                .setPositiveButton(confirm_string) { _, _ -> }
                .show()
            firstTime = false
        }

        assessment_recycler_view.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = AssessmentListAdapter()
        }

        assessment_swipe_refresh.apply {
            isRefreshing = true
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { getData() }
        }

        getData()
    }

    private inner class AssessmentListAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
        var data = listOf<Triple<String, Boolean, String>>()

        private inner class LessonViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val name: TextView = view.findViewById(R.id.assessment_lesson_name)
            val state: ImageView = view.findViewById(R.id.assessment_lesson_state_image)
        }

        fun post(src: List<Triple<String, Boolean, String>>) {
            data = src
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = LessonViewHolder(
            LayoutInflater.from(parent.context).inflate(R.layout.item_assessment_lesson_name, parent, false)
        )

        override fun getItemCount() = data.size

        override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
            holder as LessonViewHolder
            val item = data[position]
            holder.name.text = item.first
            holder.state.setImageResource(if (item.second) R.drawable.ic_check_black_24dp else R.drawable.ic_remove_black_24dp)
            if (item.third != "") {
                holder.itemView.setOnClickListener {
                    NavHostFragment.findNavController(this@AssessmentFragment).navigate(
                        R.id.assessmentDetailFragment,
                        Bundle().apply {
                            putString("url", item.third)
                            putString("title", item.first)
                        }
                    )
                }
                holder.itemView.setOnLongClickListener {
                    safeThread {
                        Network.getAssessmentForm(item.third)?.run {
                            overall.score.value = "7"
                            teachers.forEach { it.autoScore() }
                            assistants.forEach { it.autoScore() }
                            if (Network.postAssessmentForm(serialize()) != null) {
                                view?.handler?.post {
                                    Toast.makeText(context, auto_7_string, Toast.LENGTH_SHORT).show()
                                    getData()
                                }
                            }
                        }
                    }
                    false
                }
            }
        }
    }
}
