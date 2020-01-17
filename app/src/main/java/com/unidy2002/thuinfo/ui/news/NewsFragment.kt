package com.unidy2002.thuinfo.ui.news

import android.os.Bundle
import android.os.Handler
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProviders
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.lib.Network
import com.unidy2002.thuinfo.data.lib.Network.Companion.MODE.*
import com.unidy2002.thuinfo.data.model.NewsCardAdapter
import com.unidy2002.thuinfo.data.model.NewsCardAdapter.Companion.updating
import com.unidy2002.thuinfo.data.model.NewsCardAdapter.OnLoadMoreListener
import com.unidy2002.thuinfo.userModel
import kotlin.concurrent.thread

class NewsFragment : Fragment() {

    private lateinit var newsViewModel: NewsViewModel

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        newsViewModel = ViewModelProviders.of(this).get(NewsViewModel::class.java)
        return inflater.inflate(R.layout.fragment_news, container, false)
    }

    private val handler = Handler()

    private fun updateUI() {
        view?.findViewById<SwipeRefreshLayout>(R.id.swipe_refresh)!!.isRefreshing = false
        view?.findViewById<ProgressBar>(R.id.news_loading)?.visibility = View.GONE
        val recyclerView = view?.findViewById<RecyclerView>(R.id.recycler_view)!!
        (recyclerView.adapter as NewsCardAdapter).append(userModel.newsContainer.newsCardList)
        updating = false
    }

    override fun onStart() {
        val recyclerView = view?.findViewById<RecyclerView>(R.id.recycler_view)!!
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = NewsCardAdapter().apply {
            setOnItemClickListener(object : NewsCardAdapter.OnItemClickListener {
                override fun onClick(position: Int) {
                    Log.d("MSG", this@apply.newsCardList[position].href.replace("amp;", ""))
                    val bundle = Bundle()
                    bundle.putString("url", this@apply.newsCardList[position].href.replace("amp;", ""))
                    NavHostFragment.findNavController(this@NewsFragment)
                        .navigate(R.id.webFragment, bundle)
                }
            })
            setOnItemLongClickListener(object : NewsCardAdapter.OnItemLongClickListener {
                override fun onLongClick(position: Int) {
                    Toast.makeText(context, "Long click $position", Toast.LENGTH_SHORT).show()
                }
            })
        }
        recyclerView.addOnScrollListener(object : OnLoadMoreListener() {
            override fun onLoading(countItem: Int, lastItem: Int) {
                thread(start = true) {
                    Network().getNews(MORE)
                    handler.post { updateUI() }
                }
            }
        })
        val refresh = view?.findViewById<SwipeRefreshLayout>(R.id.swipe_refresh)!!
        refresh.isRefreshing = false
        refresh.setColorSchemeResources(R.color.colorAccent)
        refresh.setOnRefreshListener {
            thread(start = true) {
                Network().getNews(REFRESH)
                handler.post { updateUI() }
            }
        }
        thread(start = true) {
            Network().getNews(NONE)
            handler.post { updateUI() }
        }
        super.onStart()
    }
}