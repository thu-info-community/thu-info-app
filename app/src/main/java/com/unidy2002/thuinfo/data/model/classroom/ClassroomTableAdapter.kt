package com.unidy2002.thuinfo.data.model.classroom

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R

class ClassroomTableAdapter(
    private val list: List<Pair<String, List<Int>>>,
    private val colors: List<Int>,
    private val day: Int
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        var name: TextView = view.findViewById(R.id.classroom_name)
        var state: List<View> = listOf(
            view.findViewById(R.id.state1),
            view.findViewById(R.id.state2),
            view.findViewById(R.id.state3),
            view.findViewById(R.id.state4),
            view.findViewById(R.id.state5),
            view.findViewById(R.id.state6)
        )
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder =
        ViewHolder(
            LayoutInflater.from(
                parent.context
            ).inflate(R.layout.item_classroom_row, parent, false)
        )

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val viewHolder = holder as ViewHolder
        viewHolder.name.text = list[position].first
        for (i in viewHolder.state.indices)
            viewHolder.state[i].setBackgroundColor(colors[list[position].second[i + (day - 1) * 6]])
    }

    override fun getItemCount() = list.size
}