package com.unidy2002.thuinfo.ui.news

import android.os.Bundle
import android.os.Parcelable
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.news.NewsAdapter
import com.unidy2002.thuinfo.data.model.news.NewsAdapter.Companion.updating
import com.unidy2002.thuinfo.data.model.news.NewsAdapter.OnLoadMoreListener
import com.unidy2002.thuinfo.data.model.news.NewsContainer
import kotlin.concurrent.thread

class NewsFragment : Fragment() {

    private lateinit var recyclerViewState: Parcelable
    private lateinit var newsContainer: NewsContainer
    private var state = -1

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_news, container, false)

    private fun updateUI(force: Boolean) {
        view?.findViewById<SwipeRefreshLayout>(R.id.news_swipe_refresh)?.isRefreshing = false
        (view?.findViewById<RecyclerView>(R.id.news_recycler_view)?.adapter as? NewsAdapter)?.push(force)
        updating = false
    }

    override fun onStart() {
        if (!::newsContainer.isInitialized) newsContainer = NewsContainer(context)
        state = arguments?.getInt("state", -1) ?: -1
        if (state != -1)
            (activity as AppCompatActivity).supportActionBar?.title = newsContainer.newsOriginList[state].name

        view?.findViewById<SwipeRefreshLayout>(R.id.news_swipe_refresh)?.apply {
            setColorSchemeResources(R.color.colorAccent)
            isRefreshing = true
            setOnRefreshListener {
                thread {
                    newsContainer.getNews(state, 10, true)
                    view?.handler?.post { updateUI(true) }
                }
            }
        }

        view?.findViewById<RecyclerView>(R.id.news_recycler_view)?.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = NewsAdapter(newsContainer).apply {
                setOnItemClickListener(object : NewsAdapter.OnItemClickListener {
                    override fun onClick(href: String) {
                        NavHostFragment.findNavController(this@NewsFragment)
                            .navigate(R.id.webFragment, Bundle().apply { putString("url", href) })
                    }
                })
                setOnAvatarClickListener(object : NewsAdapter.OnAvatarClickListener {
                    override fun onClick(id: Int) {
                        if (state == -1)
                            NavHostFragment.findNavController(this@NewsFragment)
                                .navigate(R.id.newsFragment, Bundle().apply { putInt("state", id) })
                    }
                })
            }
            addOnScrollListener(object : OnLoadMoreListener() {
                override fun onLoading() {
                    thread {
                        newsContainer.getNews(state, 10, false)
                        view?.handler?.post { updateUI(false) }
                    }
                }
            })
            if (::recyclerViewState.isInitialized) {
                updateUI(false)
                layoutManager?.onRestoreInstanceState(recyclerViewState)
            } else
                thread {
                    newsContainer.getNews(state, 10, false)
                    view?.handler?.post { updateUI(true) }
                }
        }

        super.onStart()
    }

    override fun onPause() {
        view?.findViewById<RecyclerView>(R.id.news_recycler_view)?.layoutManager?.onSaveInstanceState()?.run {
            recyclerViewState = this
        }
        super.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        newsContainer.close()
    }
}