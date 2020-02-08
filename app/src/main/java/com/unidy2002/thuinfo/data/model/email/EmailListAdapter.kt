package com.unidy2002.thuinfo.data.model.email

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.RecyclerView.SCROLL_STATE_DRAGGING
import androidx.recyclerview.widget.RecyclerView.SCROLL_STATE_SETTLING
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

    fun push(list: List<EmailListModel>, startIndex: Int) {
        if (startIndex == 0) emailList.clear()
        if (startIndex == emailList.size) { // Consistency
            emailList.addAll(list)
            if (startIndex == 0) notifyDataSetChanged() else notifyItemRangeInserted(startIndex, list.size)
        }
        onLoadMoreListener.updating = false
    }

    interface OnItemClickListener {
        fun onClick(index: Int)
    }

    private lateinit var clickListener: OnItemClickListener

    fun setOnItemClickListener(listener: OnItemClickListener) {
        this.clickListener = listener
    }

    lateinit var onLoadMoreListener: OnLoadMoreListener

    abstract class OnLoadMoreListener : RecyclerView.OnScrollListener() {
        var updating = false

        private var isScrolling = false

        protected abstract fun onLoading()

        override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
            isScrolling = newState == SCROLL_STATE_DRAGGING || newState == SCROLL_STATE_SETTLING
        }

        override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
            with(recyclerView.layoutManager as LinearLayoutManager) {
                if (itemCount - findLastCompletelyVisibleItemPosition() <= 7 && !updating) {
                    updating = true
                    onLoading()
                }
            }
        }
    }

}