package com.unidy2002.thuinfo.data.model.email

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R
import java.text.SimpleDateFormat
import java.util.*

class EmailListAdapter(private val isInbox: Boolean) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val emailList = mutableListOf<EmailModel>()

    class CardViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val title: TextView? = view.findViewById(R.id.email_card_title)
        val name: TextView? = view.findViewById(R.id.email_card_name)
        val date: TextView? = view.findViewById(R.id.email_card_date)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        CardViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_email_card, parent, false))

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        holder as CardViewHolder
        emailList[position].run {
            holder.title?.text = subject
            if (!isRead) holder.title?.setTextColor(Color.rgb(0, 133, 119))
            else holder.title?.setTextColor(Color.rgb(64, 64, 64))
            holder.name?.text = if (isInbox) from.name else to.joinToString { it.name }
            holder.date?.text = SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).format(date)
            holder.itemView.apply {
                setOnClickListener {
                    if (this@EmailListAdapter::clickListener.isInitialized)
                        clickListener.onClick(position, this@run)
                }
                setOnLongClickListener {
                    if (this@EmailListAdapter::longClickListener.isInitialized)
                        longClickListener.onLongClick(position, this@run)
                    true
                }
            }
        }
    }

    override fun getItemCount() = emailList.size

    fun push(list: List<EmailModel>, force: Boolean = false) {
        val start = itemCount
        if (force) emailList.clear()
        list.forEach { emailList.add(it) }
        if (force) notifyDataSetChanged() else notifyItemRangeInserted(start, list.size)
    }

    interface OnItemClickListener {
        fun onClick(index: Int, emailModel: EmailModel)
    }

    private lateinit var clickListener: OnItemClickListener

    fun setOnItemClickListener(listener: OnItemClickListener) {
        this.clickListener = listener
    }

    interface OnItemLongClickListener {
        fun onLongClick(index: Int, emailModel: EmailModel)
    }

    private lateinit var longClickListener: OnItemLongClickListener

    fun setOnItemLongClickListener(longClickListener: OnItemLongClickListener) {
        this.longClickListener = longClickListener
    }
}