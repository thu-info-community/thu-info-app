package com.unidy2002.thuinfo.ui.home

import android.app.DatePickerDialog
import android.os.Bundle
import android.text.Spannable
import android.text.SpannableString
import android.text.style.AbsoluteSizeSpan
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.bin.david.form.core.SmartTable
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.tables.ECardRecord
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getECard
import com.unidy2002.thuinfo.data.util.SchoolCalendar
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_e_card_table.*
import java.util.*

class ECardTableFragment : Fragment() {
    private lateinit var today: SchoolCalendar

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_e_card_table, container, false)

    private fun updateUI(result: ECardRecord?) {
        if (result == null) {
            context?.run { Toast.makeText(this, R.string.network_error_string, Toast.LENGTH_LONG).show() }
        } else {
            view?.findViewById<SmartTable<ECardRecord.ECardElement>>(R.id.table)?.apply {
                setData(result.eCardList)
                isEnabled = true
            }
            fun span(value: Double) = SpannableString(String.format("%.2f", value)).apply {
                setSpan(AbsoluteSizeSpan(32), this.length - 3, this.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            income_value.text = span(result.income)
            expenditure_value.text = span(result.expenditure)
            remainder_value.text = span(result.remainder)
        }
        loading.visibility = ProgressBar.GONE
    }

    private fun getData() {
        loading.visibility = ProgressBar.VISIBLE
        safeThread {
            Network.getECard(e_card_date_start.text.toString(), e_card_date_end.text.toString()).run {
                view?.handler?.post { updateUI(this) }
            }
        }
    }

    override fun onStart() {
        super.onStart()

        if (!::today.isInitialized) {
            today = SchoolCalendar()

            val year = today.get(Calendar.YEAR)
            val month = today.get(Calendar.MONTH) + 1
            val day = today.get(Calendar.DAY_OF_MONTH)

            e_card_date_start.text = String.format("%04d-%02d-%02d", year - 1, month, day)
            e_card_date_end.text = String.format("%04d-%02d-%02d", year, month, day)

            e_card_date_start.setDateConfigListener()
            e_card_date_end.setDateConfigListener()

            e_card_do_query.setOnClickListener { getData() }

            getData()
        }
    }

    private fun TextView.setDateConfigListener() {
        setOnClickListener {
            context?.run {
                DatePickerDialog(
                    this,
                    { _, year, month, day ->
                        text = String.format("%04d-%02d-%02d", year, month + 1, day)
                    },
                    text.substring(0, 4).toInt(),
                    text.substring(5, 7).toInt() - 1,
                    text.substring(8, 10).toInt()
                ).show()
            }
        }
    }
}