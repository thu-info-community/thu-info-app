package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.os.Parcelable
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.RecyclerView.Adapter
import androidx.recyclerview.widget.RecyclerView.ViewHolder
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import cn.leancloud.AVObject
import cn.leancloud.AVQuery
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.ui.home.LafMainFragment.TYPE.FOUND
import com.unidy2002.thuinfo.ui.home.LafMainFragment.TYPE.LOST
import io.reactivex.Observer
import io.reactivex.disposables.Disposable
import kotlinx.android.synthetic.main.fragment_laf_page.*
import java.io.Serializable

class LafPageFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_laf_page, container, false)

    private var type = LOST

    private var swipeRefresh: SwipeRefreshLayout? = null

    private var lafAdapter = LafAdapter()

    private lateinit var recyclerViewState: Parcelable

    override fun onStart() {
        super.onStart()
        if (arguments?.getString("type") == "found") type = FOUND
        swipeRefresh = laf_swipe_refresh.apply {
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { lafAdapter.refresh() }
        }

        laf_recycler_view.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = lafAdapter.also { it.refresh() }
            if (::recyclerViewState.isInitialized) {
                layoutManager?.onRestoreInstanceState(recyclerViewState)
            }
            addOnScrollListener(object : RecyclerView.OnScrollListener() {
                override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
                    with(recyclerView.layoutManager as LinearLayoutManager) {
                        if (itemCount - findLastCompletelyVisibleItemPosition() <= 4 && swipeRefresh?.isRefreshing == false)
                            lafAdapter.fetch()
                    }
                }
            })
        }
    }

    data class LafItem(
        val subject: String,
        val locale: String,
        val time: String,
        val id: String,
        val detail: String,
        val contact: String
    ) : Serializable {
        val bundle get() = Bundle().apply { putSerializable("data", this@LafItem) }
    }

    private inner class LafAdapter : Adapter<ViewHolder>() {
        private val data = mutableListOf<LafItem>()

        private inner class LafViewHolder(view: View) : ViewHolder(view) {
            var subject: TextView = view.findViewById(R.id.laf_card_subject)
            var locale: TextView = view.findViewById(R.id.laf_card_locale)
            var time: TextView = view.findViewById(R.id.laf_card_time)
        }

        fun fetch() {
            swipeRefresh?.isRefreshing = true
            AVQuery<AVObject>(type.toString()).run {
                skip(data.size)
                limit(10)
                findInBackground().subscribe(object : Observer<List<AVObject>> {
                    val last = data.size

                    override fun onComplete() {
                        try {
                            if (data.size == last)
                                context?.run { Toast.makeText(this, R.string.no_more, Toast.LENGTH_SHORT).show() }
                            else
                                notifyItemRangeInserted(last, data.size - last + 1)
                            swipeRefresh?.isRefreshing = false
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }

                    override fun onNext(t: List<AVObject>) {
                        data.addAll(t.map {
                            LafItem(
                                it.getString("subject"),
                                it.getString("locale"),
                                it.getString("time"),
                                it.getString("id"),
                                it.getString("detail"),
                                it.getString("contact")
                            )
                        })
                    }

                    override fun onError(e: Throwable) {
                        e.printStackTrace()
                        swipeRefresh?.isRefreshing = false
                        context?.run { Toast.makeText(this, R.string.load_fail_string, Toast.LENGTH_SHORT).show() }
                    }

                    override fun onSubscribe(d: Disposable) {}
                })
            }
        }

        fun refresh() {
            if (data.isNotEmpty()) {
                data.clear()
                notifyDataSetChanged()
            }
            fetch()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            LafViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_laf_card, parent, false))

        override fun getItemCount() = data.size

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder as LafViewHolder
            val item = data[position]
            holder.subject.text = item.subject
            holder.locale.text = item.locale
            holder.time.text = item.time
            holder.itemView.setOnClickListener {
                NavHostFragment.findNavController(this@LafPageFragment).navigate(R.id.lafDetailFragment, item.bundle)
            }
        }
    }

    override fun onPause() {
        laf_recycler_view.layoutManager?.onSaveInstanceState()?.run {
            recyclerViewState = this
        }
        super.onPause()
    }
}