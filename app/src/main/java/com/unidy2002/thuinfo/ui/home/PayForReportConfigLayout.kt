package com.unidy2002.thuinfo.ui.home

import android.content.Context
import android.view.LayoutInflater
import android.widget.EditText
import android.widget.LinearLayout
import com.unidy2002.thuinfo.R

class PayForReportConfigLayout(context: Context) : LinearLayout(context) {
    val email: EditText = (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
        .inflate(R.layout.item_pay_report_email, this, true)
        .findViewById(R.id.pay_report_input)
}