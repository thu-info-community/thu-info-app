package com.unidy2002.thuinfo.ui.schedule

import android.app.AlertDialog
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.model.schedule.Schedule


class CustomizeFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_customize, container, false)

    override fun onStart() {
        super.onStart()

        view?.findViewById<RecyclerView>(R.id.custom_recycler_view)?.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = CustomizeAdapter(loggedInUser.schedule)
        }
    }

    inner class CustomizeAdapter(val schedule: Schedule) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

        private val lessonNames = schedule.autoLessonList.map { it.title }.toMutableSet().toList()

        inner class CustomizeViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val origin: TextView? = view.findViewById(R.id.custom_origin_name)
            val new: TextView? = view.findViewById(R.id.custom_new_name)
            val image: ImageView? = view.findViewById(R.id.custom_image_button)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            CustomizeViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_custom_card, parent, false))

        override fun getItemCount() = lessonNames.size

        override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
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
                        .setTitle(R.string.setup_abbr_string)
                        .setView(input)
                        .setPositiveButton(R.string.confirm_string) { _, _ ->
                            with(input.new.text) {
                                if (isNotBlank()) {
                                    holder.new?.text = this
                                    notifyItemChanged(position)
                                    schedule.addShorten(originalName,toString())
                                }
                            }
                        }
                        .setCancelable(false)
                        .show()
                }
            }
        }
    }

    class CustomPopupLayout(context: Context) : LinearLayout(context) {
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
                                setText(resources.getString(R.string._x_7, this@with))
                                setTextColor(if (this@with > 7) Color.rgb(216, 27, 96) else Color.argb(222, 0, 0, 0))
                            }
                        }
                    }
                }
        }
    }
}