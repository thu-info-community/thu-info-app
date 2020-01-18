package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.os.Handler
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.GridLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.view.marginEnd
import androidx.core.view.setPadding
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.Network
import kotlin.concurrent.thread

class PhysicalExamFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_physical_exam, container, false)

    private fun updateUI(result: Map<String, String?>) {
        if (result.isEmpty()) {
            Toast.makeText(context, "尚未开放体测成绩查询", Toast.LENGTH_LONG).show()
        } else {
            view?.findViewById<GridLayout>(R.id.physical_exam_grid)?.apply {
                val resultList = result.toList()
                val standardWidth = view?.findViewById<TextView>(R.id.physical_exam_pivot)!!.width
                for (i in resultList.indices) {
                    addView(
                        TextView(context).apply {
                            text = resultList[i].first
                            width = standardWidth
                            gravity = Gravity.END
                            setPadding(15)
                        })
                    addView(
                        TextView(context).apply {
                            text = resultList[i].second
                            width = standardWidth
                            gravity = Gravity.START
                            setPadding(15)
                        })
                }
            }
        }
        view?.findViewById<ProgressBar>(R.id.physical_exam_loading)?.visibility = View.GONE
    }

    private val handler = Handler()

    override fun onStart() {
        thread(start = true) {
            val result = Network().getPhysicalExaminationResult()
            handler.post { updateUI(result) }
        }
        super.onStart()
    }
}