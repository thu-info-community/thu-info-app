package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.os.Handler
import android.text.Spannable
import android.text.SpannableString
import android.text.style.AbsoluteSizeSpan
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.bin.david.form.core.SmartTable
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.Network
import com.unidy2002.thuinfo.data.model.ECardRecord
import kotlin.concurrent.thread

class ECardTableFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_e_card_table, container, false)
    }

    private fun updateUI(result: ECardRecord?) {
        if (result == null) {
            Toast.makeText(context, "网络异常", Toast.LENGTH_LONG).show()
        } else {
            view?.findViewById<SmartTable<ECardRecord.ECardElement>>(R.id.table)?.apply {
                setData(result.eCardList)
                isEnabled = true
            }
            fun span(value: Double) =
                SpannableString(String.format("%.2f", value)).apply {
                    setSpan(AbsoluteSizeSpan(32), this.length - 3, this.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
            view?.findViewById<TextView>(R.id.income_value)?.text = span(result.income)
            view?.findViewById<TextView>(R.id.expenditure_value)?.text = span(result.expenditure)
            view?.findViewById<TextView>(R.id.remainder_value)?.text = span(result.remainder)
        }
        view?.findViewById<ProgressBar>(R.id.loading)?.visibility = ProgressBar.GONE
        view?.findViewById<Button>(R.id.why)?.isEnabled = true
        view?.findViewById<Button>(R.id.refresh)?.isEnabled = true
    }

    private val handler = Handler()

    private fun getData() {
        Network().getECard().run { handler.post { updateUI(this) } }
    }

    override fun onStart() {
        val why = view?.findViewById<Button>(R.id.why)
        why?.setOnClickListener {
            AlertDialog.Builder(view?.context!!)
                .setTitle("余额可能与实际不符")
                .setMessage(
                    "由于尚未找到直接查询余额的接口，此处的余额数据是根据交易记录得到的推算结果。"
                )
                .show()
        }

        val refresh = view?.findViewById<Button>(R.id.refresh)
        refresh?.setOnClickListener {
            why?.isEnabled = false
            refresh.isEnabled = false
            view?.findViewById<ProgressBar>(R.id.loading)?.visibility = ProgressBar.VISIBLE
            view?.findViewById<SmartTable<ECardRecord.ECardElement>>(R.id.table)?.isEnabled = false
            thread(start = true) { getData() }
        }

        thread(start = true) { getData() }
        super.onStart()
    }
}