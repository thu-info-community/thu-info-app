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
import com.unidy2002.thuinfo.data.model.EcardTable
import com.unidy2002.thuinfo.ui.login.LoginActivity
import kotlin.concurrent.thread


class EcardTableFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.ecard_table, container, false)
    }

    private fun updateUI() {
        val loggedInUser = LoginActivity.loginViewModel.getLoggedInUser()
        val incomeValue = view?.findViewById<TextView>(R.id.income_value)
        val expenditureValue = view?.findViewById<TextView>(R.id.expenditure_value)
        val remainderValue = view?.findViewById<TextView>(R.id.remainder_value)
        val table = view?.findViewById<SmartTable<EcardTable.ECardElement>>(R.id.table)
        val loading = view?.findViewById<ProgressBar>(R.id.loading)
        val why = view?.findViewById<Button>(R.id.why)
        val refresh = view?.findViewById<Button>(R.id.refresh)
        table?.setData(loggedInUser.eCardTable.eCardList)
        table?.isEnabled = true
        incomeValue?.text = with(String.format("%.2f", loggedInUser.eCardTable.income)) {
            SpannableString(this).apply {
                setSpan(AbsoluteSizeSpan(32), this.length - 3, this.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
        }
        expenditureValue?.text = with(String.format("%.2f", loggedInUser.eCardTable.expenditure)) {
            SpannableString(this).apply {
                setSpan(AbsoluteSizeSpan(32), this.length - 3, this.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
        }
        remainderValue?.text = with(String.format("%.2f", loggedInUser.eCardTable.remainder)) {
            SpannableString(this).apply {
                setSpan(AbsoluteSizeSpan(32), this.length - 3, this.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
        }
        loading?.visibility = ProgressBar.GONE
        why?.isEnabled = true
        refresh?.isEnabled = true
    }

    private val handler = Handler()

    override fun onStart() {
        super.onStart()
        thread(start = true) {
            if (Network().getEcard(false)) {
                handler.post { updateUI() }
            } else {
                Toast.makeText(context, "网络异常", Toast.LENGTH_LONG).show()
                fragmentManager?.popBackStack()
            }
        }

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
            view?.findViewById<SmartTable<EcardTable.ECardElement>>(R.id.table)?.isEnabled = false
            thread(start = true) {
                if (Network().getEcard(true)) {
                    handler.post { updateUI() }
                } else {
                    Toast.makeText(context, "网络异常", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}