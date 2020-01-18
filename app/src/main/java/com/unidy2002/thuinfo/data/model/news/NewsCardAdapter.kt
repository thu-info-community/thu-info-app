package com.unidy2002.thuinfo.data.model.news

import android.graphics.Typeface
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.StyleSpan
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.RecyclerView.SCROLL_STATE_DRAGGING
import androidx.recyclerview.widget.RecyclerView.SCROLL_STATE_SETTLING
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.ui.login.LoginActivity
import java.text.SimpleDateFormat
import java.util.*

class NewsCardAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    class CardViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        var avatar: ImageView = view.findViewById(R.id.card_avatar)
        var username: TextView = view.findViewById(R.id.username)
        var time: TextView = view.findViewById(R.id.time)
        val title: TextView = view.findViewById(R.id.title)
        var brief: TextView = view.findViewById(R.id.brief)
    }

    class FooterViewHolder(view: View) : RecyclerView.ViewHolder(view)

    var newsCardList = mutableListOf<NewsCard>()

    fun append(newList: MutableList<NewsCard>) {
        val start = newsCardList.size
        newsCardList = newList
        notifyItemRangeInserted(start, newList.size - start + 1)
    }

    override fun getItemViewType(position: Int) = if (position == newsCardList.size) 1 else 0

    override fun onCreateViewHolder(
        parent: ViewGroup,
        viewType: Int
    ) =
        if (viewType == 1)
            FooterViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.news_footer, parent, false))
        else
            CardViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.news_card, parent, false))

    override fun onBindViewHolder(
        holder: RecyclerView.ViewHolder,
        position: Int
    ) {
        if (getItemViewType(position) == 0) {
            val cardViewHolder = holder as CardViewHolder
            val newsCard = newsCardList[position]
            cardViewHolder.avatar.setImageResource(
                when (newsCard.originId) {
                    0 -> R.drawable.avatar00
                    1 -> R.drawable.avatar01
                    2 -> R.drawable.avatar02
                    3 -> R.drawable.avatar03
                    4 -> R.drawable.avatar04
                    else -> R.mipmap.ic_launcher_round
                }
            )
            cardViewHolder.username.text =
                LoginActivity.loginViewModel.getLoggedInUser().newsContainer.newsOriginList[newsCard.originId].name
            cardViewHolder.time.text = SimpleDateFormat("yyy-MM-dd", Locale.CHINA).format(newsCard.date)
            cardViewHolder.title.text = newsCard.title
            cardViewHolder.brief.text = SpannableStringBuilder(newsCard.sender).apply {
                setSpan(StyleSpan(Typeface.BOLD), 0, this.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }.append("：" + newsCard.brief)

            cardViewHolder.itemView.setOnClickListener {
                if (this::clickListener.isInitialized) {
                    clickListener.onClick(position)
                }
            }

            cardViewHolder.itemView.setOnLongClickListener {
                if (this::longClickListener.isInitialized) {
                    longClickListener.onLongClick(position)
                }
                true
            }
        }
    }

    override fun getItemCount() =
        if (newsCardList.isEmpty())
            0
        else
            newsCardList.size + 1

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

    abstract class OnLoadMoreListener : RecyclerView.OnScrollListener() {
        private var isScrolling = false

        protected abstract fun onLoading(countItem: Int, lastItem: Int)

        override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
            isScrolling = newState == SCROLL_STATE_DRAGGING || newState == SCROLL_STATE_SETTLING
        }

        override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
            with(recyclerView.layoutManager as LinearLayoutManager) {
                val lastItemPosition = this.findLastCompletelyVisibleItemPosition()
                if (this.itemCount - lastItemPosition <= 4 && !updating) {
                    updating = true
                    onLoading(itemCount, lastItemPosition)
                }
            }
        }
    }

    companion object {
        var updating = false
    }
}