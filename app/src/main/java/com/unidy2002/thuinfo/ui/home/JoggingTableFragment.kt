package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.bin.david.form.core.SmartTable
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.tables.JoggingRecord
import com.unidy2002.thuinfo.data.util.Network
import kotlin.concurrent.thread

class JoggingTableFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_jogging_table, container, false)

    private fun updateUI(joggingList: List<JoggingRecord>?) {
        when {
            joggingList == null -> context?.run {
                Toast.makeText(this, R.string.network_error_retry, Toast.LENGTH_SHORT).show()
            }
            joggingList.isEmpty() -> context?.run {
                Toast.makeText(this,R.string.jogging_no_score, Toast.LENGTH_SHORT).show()
            }
            else -> view?.findViewById<SmartTable<JoggingRecord>>(R.id.jogging_table)?.setData(joggingList)
        }
        view?.findViewById<ProgressBar>(R.id.jogging_loading)?.visibility = ProgressBar.GONE
    }

    override fun onStart() {
        thread {
            val result = Network.getJoggingRecord()
            view?.handler?.post { updateUI(result) }
        }
        super.onStart()
    }
}