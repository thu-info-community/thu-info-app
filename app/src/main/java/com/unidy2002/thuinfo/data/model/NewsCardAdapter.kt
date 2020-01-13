package com.unidy2002.thuinfo.data.model

import android.graphics.Typeface
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.StyleSpan
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R

class NewsCardAdapter(private val newsCardList: List<NewsCard>) : RecyclerView.Adapter<NewsCardAdapter.ViewHolder>() {
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        var avatar: ImageView = view.findViewById(R.id.avatar)
        var username: TextView = view.findViewById(R.id.username)
        var time: TextView = view.findViewById(R.id.time)
        var brief: TextView = view.findViewById(R.id.brief)
    }

    override fun onCreateViewHolder(
        parent: ViewGroup,
        viewType: Int
    ): ViewHolder {
        return ViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.news_card, parent, false))
    }

    override fun onBindViewHolder(
        holder: ViewHolder,
        position: Int
    ) {
        val newsCard = newsCardList[position]
        holder.username.text = when (newsCard.categoryId) {
            0 -> "教务公告"
            else -> "其他信息"
        }
        holder.time.text = newsCard.time
        holder.brief.text = SpannableStringBuilder(newsCard.sender).apply {
            setSpan(StyleSpan(Typeface.BOLD), 0, this.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }.append("：" + newsCard.brief)

        holder.itemView.setOnClickListener {
            if (this::clickListener.isInitialized) {
                clickListener.onClick(position)
            }
        }

        holder.itemView.setOnLongClickListener {
            if (this::longClickListener.isInitialized) {
                longClickListener.onLongClick(position)
            }
            true
        }
    }

    override fun getItemCount() = newsCardList.size

    interface OnItemClickListener {
        fun onClick(position: Int)
    }

    private lateinit var clickListener: OnItemClickListener

    fun setOnItemClickListener(listener: OnItemClickListener) {
        this.clickListener = listener
    }

    interface OnItemLongClickListener {
        fun onLongClick(position: Int)
    }

    private lateinit var longClickListener: OnItemLongClickListener

    fun setOnItemLongClickListener(longClickListener: OnItemLongClickListener) {
        this.longClickListener = longClickListener
    }
}