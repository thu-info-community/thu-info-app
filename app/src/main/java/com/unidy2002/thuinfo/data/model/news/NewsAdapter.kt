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
import com.unidy2002.thuinfo.data.util.Network
import java.text.SimpleDateFormat
import java.util.*
import kotlin.concurrent.thread

class NewsAdapter(private val newsContainer: NewsContainer) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    class CardViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        var avatar: ImageView = view.findViewById(R.id.card_avatar)
        var username: TextView = view.findViewById(R.id.username)
        var time: TextView = view.findViewById(R.id.time)
        val title: TextView = view.findViewById(R.id.title)
        var brief: TextView = view.findViewById(R.id.brief)
    }

    class FooterViewHolder(view: View) : RecyclerView.ViewHolder(view)

    private var newsCardList = emptyList<NewsItem>()

    fun push(force: Boolean) {
        val start = newsCardList.size
        newsCardList = newsContainer.newsList
        if (force) notifyDataSetChanged() else notifyItemRangeInserted(start, newsCardList.size - start + 1)
    }

    override fun getItemViewType(position: Int) = if (position == newsCardList.size) 1 else 0

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        if (viewType == 1)
            FooterViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_news_footer, parent, false))
        else
            CardViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_news_card, parent, false))

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        if (position != newsCardList.size) {
            holder as CardViewHolder
            val newsCard = newsCardList[position]
            holder.avatar.apply {
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
                    if (::avatarClickListener.isInitialized)
                        avatarClickListener.onClick(newsCard.originId)
                }
            }

            holder.username.text = newsContainer.newsOriginList[newsCard.originId].name
            holder.time.text = SimpleDateFormat("yyy-MM-dd", Locale.CHINA).format(newsCard.date)
            holder.title.text = newsCard.title
            holder.brief.apply {
                text = SpannableStringBuilder(newsCard.sender).apply {
                    setSpan(StyleSpan(Typeface.BOLD), 0, this.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }.append("：" + newsCard.brief)
                setLines(4 - holder.title.lineCount.run { if (this == 0) 2 else this })
            }

            holder.itemView.setOnClickListener {
                if (::clickListener.isInitialized)
                    clickListener.onClick(newsCardList[position].href.replace("amp;", ""))
            }

            if (!newsCard.loaded) {
                newsCard.loaded = true
                thread {
                    fun String.dry(title: String) = // Don't repeat yourself
                        if (this != title && indexOf(title) == 0) substring(title.length) else this

                    newsCard.brief = Network().getPrettyPrintHTML(newsCard.href)?.brief?.dry(newsCard.title)
                        ?.also { newsContainer.newsDBManager.add(newsCard.title, newsCard.href, it) }
                        ?: "加载失败"
                    handler.post { notifyItemChanged(position) }
                }
            }
        }
    }

    override fun getItemCount() = if (newsCardList.isEmpty()) 0 else newsCardList.size + 1

    interface OnAvatarClickListener {
        fun onClick(id: Int)
    }

    private lateinit var avatarClickListener: OnAvatarClickListener

    fun setOnAvatarClickListener(listener: OnAvatarClickListener) {
        this.avatarClickListener = listener
    }

    interface OnItemClickListener {
        fun onClick(href: String)
    }

    private lateinit var clickListener: OnItemClickListener

    fun setOnItemClickListener(listener: OnItemClickListener) {
        this.clickListener = listener
    }

    abstract class OnLoadMoreListener : RecyclerView.OnScrollListener() {
        private var isScrolling = false

        protected abstract fun onLoading()

        override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
            isScrolling = newState == SCROLL_STATE_DRAGGING || newState == SCROLL_STATE_SETTLING
        }

        override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
            with(recyclerView.layoutManager as LinearLayoutManager) {
                if (itemCount - findLastCompletelyVisibleItemPosition() <= 4 && !updating) {
                    updating = true
                    onLoading()
                }
            }
        }
    }

    private val handler = Handler()

    companion object {
        var updating = false
    }
}