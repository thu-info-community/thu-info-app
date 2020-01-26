package com.unidy2002.thuinfo.data.model.news

import android.graphics.Typeface
import android.os.Handler
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
import com.unidy2002.thuinfo.data.lib.Network
import com.unidy2002.thuinfo.ui.login.LoginActivity
import java.text.SimpleDateFormat
import java.util.*
import kotlin.concurrent.thread

class NewsAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    class CardViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        var avatar: ImageView = view.findViewById(R.id.card_avatar)
        var username: TextView = view.findViewById(R.id.username)
        var time: TextView = view.findViewById(R.id.time)
        val title: TextView = view.findViewById(R.id.title)
        var brief: TextView = view.findViewById(R.id.brief)
    }

    class FooterViewHolder(view: View) : RecyclerView.ViewHolder(view)

    var newsCardList = mutableListOf<NewsItem>()

    fun push(newList: MutableList<NewsItem>, force: Boolean) {
        val start = newsCardList.size
        newsCardList = newList
        if (force)
            notifyDataSetChanged()
        else
            notifyItemRangeInserted(start, newList.size - start + 1)
    }

    override fun getItemViewType(position: Int) = if (position == newsCardList.size) 1 else 0

    override fun onCreateViewHolder(
        parent: ViewGroup,
        viewType: Int
    ) =
        if (viewType == 1)
            FooterViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_news_footer, parent, false))
        else
            CardViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_news_card, parent, false))

    override fun onBindViewHolder(
        holder: RecyclerView.ViewHolder,
        position: Int
    ) {
        if (getItemViewType(position) == 0) {
            val cardViewHolder = holder as CardViewHolder
            val newsCard = newsCardList[position]
            cardViewHolder.avatar.apply {
                setImageResource(
                    when (newsCard.originId) {
                        0 -> R.drawable.avatar00
                        1 -> R.drawable.avatar01
                        2 -> R.drawable.avatar02
                        3 -> R.drawable.avatar03
                        4 -> R.drawable.avatar04
                        else -> R.mipmap.ic_launcher
                    }
                )
                setOnClickListener {
                    if (this@NewsAdapter::avatarClickListener.isInitialized) {
                        avatarClickListener.onClick(newsCard.originId)
                    }
                }
            }

            cardViewHolder.username.text = newsContainer.newsOriginList[newsCard.originId].name
            cardViewHolder.time.text = SimpleDateFormat("yyy-MM-dd", Locale.CHINA).format(newsCard.date)
            cardViewHolder.title.text = newsCard.title
            cardViewHolder.brief.apply {
                text = SpannableStringBuilder(newsCard.sender).apply {
                    setSpan(StyleSpan(Typeface.BOLD), 0, this.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }.append("：" + newsCard.brief)
                setLines(4 - cardViewHolder.title.lineCount.run { if (this == 0) 2 else this })
            }

            cardViewHolder.itemView.apply {
                setOnClickListener {
                    if (this@NewsAdapter::clickListener.isInitialized) {
                        clickListener.onClick(position)
                    }
                }

                setOnLongClickListener {
                    if (this@NewsAdapter::longClickListener.isInitialized) {
                        longClickListener.onLongClick(position)
                    }
                    true
                }
            }

            if (!newsCard.loaded) {
                newsCard.loaded = true
                thread(start = true) {
                    Network().getPrettyPrintHTML(newsCard.href).run {
                        newsCard.brief = this
                            ?.brief
                            ?.run {
                                if (this != newsCard.title && this.indexOf(newsCard.title) == 0)
                                    this.substring(newsCard.title.length)
                                else
                                    this
                            }
                            ?.also {
                                newsContainer.newsDBManager.add(newsCard.title, newsCard.href, it)
                            }
                            ?: "加载失败"
                        handler.post { notifyItemChanged(position) }
                    }
                }
            }
        }
    }

    override fun getItemCount() =
        if (newsCardList.isEmpty()) 0 else newsCardList.size + 1

    interface OnAvatarClickListener {
        fun onClick(param: Int)
    }

    private lateinit var avatarClickListener: OnAvatarClickListener

    fun setOnAvatarClickListener(listener: OnAvatarClickListener) {
        this.avatarClickListener = listener
    }

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

    private val handler = Handler()

    private val newsContainer: NewsContainer
        get() = LoginActivity.loginViewModel.getLoggedInUser().newsContainer

    companion object {
        var updating = false
    }
}