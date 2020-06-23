package com.unidy2002.thuinfo.ui.schedule

import android.app.AlertDialog
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.RecyclerView.Adapter
import androidx.recyclerview.widget.RecyclerView.ViewHolder
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.dao.ScheduleDBManager
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import kotlinx.android.synthetic.main.fragment_customize.*

class CustomizeFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_customize, container, false)

    override fun onStart() {
        super.onStart()

        view?.findViewById<RecyclerView>(R.id.custom_recycler_view)?.apply {
            layoutManager = LinearLayoutManager(context)
            when (arguments?.getInt("mode")) {
                1 -> {
                    adapter = CustomizeAdapter(loggedInUser.schedule)
                    (activity as? AppCompatActivity)?.supportActionBar?.setTitle(custom_abbr_string)
                }
                2 -> {
                    adapter = ManageHiddenAdapter(loggedInUser.schedule)
                    custom_hide_hint_text.visibility = View.VISIBLE
                    (activity as? AppCompatActivity)?.supportActionBar?.setTitle(manage_hidden_string)
                }
                else -> context?.run { Toast.makeText(this, schedule_exception_string, Toast.LENGTH_SHORT).show() }
            }
        }
    }

    private inner class CustomizeAdapter(private val schedule: ScheduleDBManager) : Adapter<ViewHolder>() {

        private val lessonNames = schedule.lessonNames

        private inner class CustomizeViewHolder(view: View) : ViewHolder(view) {
            val origin: TextView? = view.findViewById(R.id.custom_origin_name)
            val new: TextView? = view.findViewById(R.id.custom_new_name)
            val image: ImageView? = view.findViewById(R.id.custom_image_button)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            CustomizeViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_custom_card, parent, false))

        override fun getItemCount() = lessonNames.size

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val originalName = lessonNames[position]
            val defaultNew = schedule.abbr(originalName)
            holder as CustomizeViewHolder
            holder.origin?.text = originalName
            holder.new?.text = defaultNew
            holder.image?.setOnClickListener {
                context?.run {
                    val input = CustomPopupLayout(this).apply {
                        origin.text = originalName
                        new.hint = defaultNew
                    }
                    AlertDialog.Builder(this)
                        .setTitle(setup_abbr_string)
                        .setView(input)
                        .setPositiveButton(confirm_string) { _, _ ->
                            with(input.new.text) {
                                if (isNotBlank()) {
                                    holder.new?.text = this
                                    notifyItemChanged(position)
                                    schedule.addShorten(originalName, toString())
                                }
                            }
                        }
                        .setCancelable(false)
                        .show()
                }
            }
        }

        private inner class CustomPopupLayout(context: Context) : LinearLayout(context) {
            val origin: TextView
            val new: EditText

            init {
                (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
                    .inflate(R.layout.item_custom_popup, this, true)
                    .run {
                        origin = findViewById(R.id.custom_popup_origin)
                        new = findViewById(R.id.custom_popup_new)

                        new.doOnTextChanged { text, _, _, _ ->
                            with(text?.length ?: 0) {
                                findViewById<TextView>(R.id.custom_popup_count).apply {
                                    setText(resources.getString(_x_7, this@with))
                                    setTextColor(
                                        if (this@with > 7) Color.rgb(216, 27, 96)
                                        else Color.argb(222, 0, 0, 0)
                                    )
                                }
                            }
                        }
                    }
            }
        }
    }

    private inner class ManageHiddenAdapter(private val schedule: ScheduleDBManager) : Adapter<ViewHolder>() {

        val hiddenRules = schedule.hiddenRules

        private inner class CustomizeViewHolder(view: View) : ViewHolder(view) {
            val title: TextView? = view.findViewById(R.id.manage_hidden_title)
            val icon: ImageView? = view.findViewById(R.id.manage_hidden_btn)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = CustomizeViewHolder(
            LayoutInflater.from(parent.context).inflate(R.layout.item_manage_hidden_card, parent, false)
        )

        override fun getItemCount() = hiddenRules.size

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = hiddenRules[position]
            val level = getString(
                when (item.level) {
                    0 -> primary_string
                    1 -> secondary_string
                    else -> other_string
                }
            )
            holder as CustomizeViewHolder
            holder.title?.text = when (item.week) {
                -1 -> getString(lesson_all_format, level, item.title)
                0 -> getString(
                    lesson_repeat_format,
                    level,
                    item.title,
                    resources.getStringArray(R.array.weeks)[item.day],
                    item.begin,
                    item.end
                )
                else -> getString(
                    lesson_once_format,
                    level,
                    item.title,
                    item.week,
                    resources.getStringArray(R.array.weeks)[item.day],
                    item.begin,
                    item.end
                )
            }
            holder.icon?.setOnClickListener {
                AlertDialog.Builder(context)
                    .setMessage(sure_to_remove_rule_string)
                    .setPositiveButton(confirm_string) { _, _ ->
                        schedule.removeHiddenRule(item) {
                            notifyItemRemoved(it)
                        }
                    }
                    .setNegativeButton(cancel_string) { _, _ -> }
                    .show()
            }
        }
    }
}