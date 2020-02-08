package com.unidy2002.thuinfo.data.model.email

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R

class EmailListAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val emailList = mutableListOf<EmailListModel>()

    class CardViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val title: TextView? = view.findViewById(R.id.email_card_title)
        val name: TextView? = view.findViewById(R.id.email_card_name)
        val date: TextView? = view.findViewById(R.id.email_card_date)
    }

    fun markRead(index: Int, read: Boolean = true) {
        if (index < emailList.size) {
            emailList[index].color =
                if (read) Color.rgb(64, 64, 64)
                else Color.rgb(0, 133, 119)
            notifyItemChanged(index)
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        CardViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_email_card, parent, false))

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        holder as CardViewHolder
        emailList[position].run {
            holder.title?.text = subject
            holder.title?.setTextColor(color)
            holder.name?.text = names
            holder.date?.text = date
            holder.itemView.setOnClickListener {
                if (this@EmailListAdapter::clickListener.isInitialized)
                    clickListener.onClick(position)
            }
        }
    }

    override fun getItemCount() = emailList.size

    fun push(list: List<EmailListModel>, force: Boolean = false) {
        val start = itemCount
        if (force) emailList.clear()
        list.forEach { emailList.add(it) }
        if (force) notifyDataSetChanged() else notifyItemRangeInserted(start, list.size)
    }

    interface OnItemClickListener {
        fun onClick(index: Int)
    }

    private lateinit var clickListener: OnItemClickListener

    fun setOnItemClickListener(listener: OnItemClickListener) {
        this.clickListener = listener
    }
}