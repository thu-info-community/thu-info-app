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
import androidx.core.view.setPadding
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.util.Network
import kotlin.concurrent.thread

class PhysicalExamFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_physical_exam, container, false)

    private fun updateUI(result: Map<String, String?>?) {
        if (result == null) {
            Toast.makeText(context, R.string.exam_result_not_available, Toast.LENGTH_LONG).show()
        } else {
            view?.findViewById<GridLayout>(R.id.physical_exam_grid)?.apply {
                val standardWidth = view?.findViewById<TextView>(R.id.physical_exam_pivot)!!.width
                result.forEach { (key, value) ->
                    addView(
                        TextView(context).apply {
                            text = key
                            width = standardWidth
                            gravity = Gravity.END
                            setPadding(15)
                        })
                    addView(
                        TextView(context).apply {
                            text = value
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
            val result = Network().getPhysicalExamResult()
            handler.post { updateUI(result) }
        }
        super.onStart()
    }
}