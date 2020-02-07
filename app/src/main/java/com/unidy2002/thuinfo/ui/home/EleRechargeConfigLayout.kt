package com.unidy2002.thuinfo.ui.home

import android.content.Context
import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.widget.doOnTextChanged
import com.unidy2002.thuinfo.R

class EleRechargeConfigLayout(context: Context) : LinearLayout(context) {
    private val input: EditText?
    private val confirm: View?
    private val label: TextView?
    private val cancel: TextView?

    private fun setButtonEnabled(enabled: Boolean) {
        if (enabled) {
            confirm?.setBackgroundColor(Color.rgb(18, 143, 236))
            label?.setTextColor(Color.WHITE)
            confirm?.isClickable = true
            confirm?.isFocusable = true
        } else {
            confirm?.setBackgroundColor(Color.rgb(108, 183, 238))
            label?.setTextColor(Color.rgb(195, 227, 250))
            confirm?.isClickable = false
            confirm?.isFocusable = false
        }
    }

    fun revokeLabel() {
        setButtonEnabled(true)
        label?.setText(R.string.use_alipay_string)
    }

    init {
        (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
            .inflate(R.layout.item_ele_recharge_query, this, true)
            .run {
                input = findViewById(R.id.ele_recharge_input)
                confirm = findViewById(R.id.ele_recharge_confirm)
                label = findViewById(R.id.ele_recharge_label)
                cancel = findViewById(R.id.ele_recharge_cancel)

                input?.doOnTextChanged { text, _, _, _ ->
                    setButtonEnabled(text != null && text.matches(Regex("[0-9]+")) && text.toString().toInt() != 0)
                }

                confirm?.setOnClickListener {
                    with(input?.text.toString()) {
                        if (matches(Regex("[0-9]+"))) {
                            with(toInt()) {
                                if (this > 0) {
                                    if (::onConfirmListener.isInitialized) {
                                        setButtonEnabled(false)
                                        label?.setText(R.string.processing_string)
                                        onConfirmListener.onConfirm(this)
                                    }
                                }
                            }
                        }
                    }
                }

                cancel?.setOnClickListener {
                    if (::onCancelListener.isInitialized)
                        onCancelListener.onCancel()
                }
            }
    }

    interface OnConfirmListener {
        fun onConfirm(value: Int)
    }

    private lateinit var onConfirmListener: OnConfirmListener

    fun setOnConfirmListener(onConfirmListener: OnConfirmListener) {
        this.onConfirmListener = onConfirmListener
    }

    interface OnCancelListener {
        fun onCancel()
    }

    private lateinit var onCancelListener: OnCancelListener

    fun setOnCancelListener(onCancelListener: OnCancelListener) {
        this.onCancelListener = onCancelListener
    }
}