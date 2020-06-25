package com.unidy2002.thuinfo.ui.hole

import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.view.*
import android.view.View.GONE
import android.widget.Button
import androidx.annotation.IdRes
import com.unidy2002.thuinfo.R

// With great thanks to `com.wildma.pictureselector`
class LongClickSelectDialog(
    context: Context,
    private val canSaveImg: Boolean,
    private val canHide: Boolean,
    onClick: (Int) -> Unit
) :
    Dialog(context, R.style.HoleSelectDialogStyle), View.OnClickListener {

    private lateinit var copy: Button
    private lateinit var saveImg: Button
    private lateinit var ignore: Button
    private lateinit var cancel: Button

    private val listener = object : OnItemClickListener {
        override fun onItemClick(type: Int) {
            cancel()
            dismiss()
            onClick(type)
        }
    }

    init {
        window?.run {
            decorView.setPadding(0, 0, 0, 0)
            setGravity(Gravity.RELATIVE_LAYOUT_DIRECTION or Gravity.BOTTOM)
            attributes = attributes.apply {
                width = WindowManager.LayoutParams.MATCH_PARENT
                height = WindowManager.LayoutParams.WRAP_CONTENT
            }
            setCanceledOnTouchOutside(false)
            show()
        }
    }

    private fun <T : View> register(@IdRes resId: Int) = findViewById<T>(resId).also { it.setOnClickListener(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.dialog_hole_select)

        copy = register(R.id.hole_copy_btn)
        if (canSaveImg) {
            saveImg = register(R.id.hole_save_img_btn)
        } else {
            findViewById<Button>(R.id.hole_save_img_btn).visibility = GONE
            findViewById<View>(R.id.line_above_save_img).visibility = GONE
        }
        if (canHide) {
            ignore = register(R.id.hole_ignore_btn)
        } else {
            findViewById<Button>(R.id.hole_ignore_btn).visibility = GONE
            findViewById<View>(R.id.line_above_hide).visibility = GONE
        }
        cancel = register(R.id.hole_select_cancel_btn)

        setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
                listener.onItemClick(-1)
            }
            false
        }
    }

    override fun onClick(v: View) {
        when (v.id) {
            R.id.hole_copy_btn -> {
                listener.onItemClick(0)
            }
            R.id.hole_save_img_btn -> {
                listener.onItemClick(1)
            }
            R.id.hole_ignore_btn -> {
                listener.onItemClick(2)
            }
            R.id.hole_select_cancel_btn -> {
                listener.onItemClick(-1)
            }
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (isOutOfBounds(context, event)) listener.onItemClick(-1)
        return super.onTouchEvent(event)
    }

    private fun isOutOfBounds(context: Context, event: MotionEvent) = try {
        val x = event.x.toInt()
        val y = event.y.toInt()
        val slop = ViewConfiguration.get(context).scaledWindowTouchSlop
        val decorView = window!!.decorView
        x < -slop || y < -slop || x > decorView.width + slop || y > decorView.height + slop
    } catch (e: Exception) {
        false
    }

    interface OnItemClickListener {
        fun onItemClick(type: Int)
    }
}