package com.unidy2002.thuinfo.ui.news

import android.os.Bundle
import android.os.Handler
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.Network
import com.unidy2002.thuinfo.data.lib.Network.MODE.*
import com.unidy2002.thuinfo.data.model.news.NewsAdapter
import com.unidy2002.thuinfo.data.model.news.NewsAdapter.Companion.updating
import com.unidy2002.thuinfo.data.model.news.NewsAdapter.OnLoadMoreListener
import com.unidy2002.thuinfo.ui.login.LoginActivity
import kotlin.concurrent.thread

/* TODO: the filter part may cause problems of inconsistency, which may compromise user experience
 *       (which is already awful enough)
 */

class NewsFragment : Fragment() {

    private lateinit var newsViewModel: NewsViewModel

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        newsViewModel = ViewModelProvider(this).get(NewsViewModel::class.java)
        return inflater.inflate(R.layout.fragment_news, container, false)
    }

    private val handler = Handler()

    private fun updateUI(force: Boolean) {
        view?.findViewById<SwipeRefreshLayout>(R.id.news_swipe_refresh)?.isRefreshing = false
        (view?.findViewById<RecyclerView>(R.id.news_recycler_view)?.adapter as? NewsAdapter)
            ?.push(LoginActivity.loginViewModel.getLoggedInUser().newsContainer.newsList, force)
        updating = false
    }

    override fun onStart() {
        view?.findViewById<SwipeRefreshLayout>(R.id.news_swipe_refresh)?.apply {
            isRefreshing = true
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener {
                thread(start = true) {
                    Network().getNews(REFRESH)
                    this@NewsFragment.handler.post { updateUI(true) }
                }
            }
        }

        view?.findViewById<RecyclerView>(R.id.news_recycler_view)?.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = NewsAdapter().apply adapter@{
                setOnItemClickListener(object : NewsAdapter.OnItemClickListener {
                    override fun onClick(position: Int) {
                        NavHostFragment.findNavController(this@NewsFragment)
                            .navigate(
                                R.id.webFragment,
                                Bundle().apply {
                                    putString(
                                        "url",
                                        this@adapter.newsCardList[position].href.replace("amp;", "")
                                    )
                                }
                            )
                    }
                })
                setOnItemLongClickListener(object : NewsAdapter.OnItemLongClickListener {
                    override fun onLongClick(position: Int) {
                        Toast.makeText(context, "Long click $position", Toast.LENGTH_SHORT).show()
                    }
                })
                setOnAvatarClickListener(object : NewsAdapter.OnAvatarClickListener {
                    override fun onClick(param: Int) {
                        view?.findViewById<SwipeRefreshLayout>(R.id.news_swipe_refresh)?.isRefreshing = true
                        if (LoginActivity.loginViewModel.getLoggedInUser().newsContainer.state == -1)
                            Toast.makeText(context, "再次点击图标可退回汇总模式", Toast.LENGTH_LONG).show()
                        thread(start = true) {
                            Network().getNews(FILTER, param)
                            this@NewsFragment.handler.post { updateUI(true) }
                        }
                    }
                })
            }
            addOnScrollListener(object : OnLoadMoreListener() {
                override fun onLoading(countItem: Int, lastItem: Int) {
                    thread(start = true) {
                        Network().getNews(MORE)
                        this@NewsFragment.handler.post { updateUI(false) }
                    }
                }
            })
            if (!newsViewModel.recyclerViewStateInitialized())
                thread(start = true) {
                    Network().getNews(NONE)
                    this@NewsFragment.handler.post { updateUI(true) }
                }
            else {
                updateUI(false)
                layoutManager?.onRestoreInstanceState(newsViewModel.recyclerViewState)
            }
        }

        super.onStart()
    }

    override fun onPause() {
        try {
            newsViewModel.recyclerViewState =
                view!!.findViewById<RecyclerView>(R.id.news_recycler_view)!!.layoutManager!!.onSaveInstanceState()!!
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onPause()
    }
}