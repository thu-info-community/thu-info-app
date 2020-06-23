package com.unidy2002.thuinfo.ui.hole

import android.app.AlertDialog
import android.content.Context
import android.os.Bundle
import android.os.Parcelable
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.RecyclerView.Adapter
import androidx.recyclerview.widget.RecyclerView.ViewHolder
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.hole.HoleTitleCard
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getHoleList
import com.unidy2002.thuinfo.data.network.holeLogin
import com.unidy2002.thuinfo.data.util.encrypt
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_hole_main.*

class HoleMainFragment : Fragment() {

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_hole_main, container, false)

    private var holeAdapter = HoleAdapter()

    private lateinit var recyclerViewState: Parcelable

    override fun onStart() {
        super.onStart()

        hole_refresh_btn.setOnClickListener {
            if (!hole_swipe_refresh.isRefreshing)
                holeAdapter.refresh()
        }

        hole_new_post_btn.setOnClickListener {
            NavHostFragment.findNavController(this).navigate(R.id.holePostFragment)
        }

        hole_swipe_refresh.apply {
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { holeAdapter.refresh() }
        }

        hole_recycler_view.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = holeAdapter

            if (::recyclerViewState.isInitialized) layoutManager?.onRestoreInstanceState(recyclerViewState)

            addOnScrollListener(object : RecyclerView.OnScrollListener() {
                override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
                    with(recyclerView.layoutManager as LinearLayoutManager) {
                        if (itemCount - findLastCompletelyVisibleItemPosition() <= 10 && !hole_swipe_refresh.isRefreshing)
                            holeAdapter.fetch()
                    }
                }
            })
        }

        validate()
    }

    private fun validate() {
        safeThread {
            if (Network.holeLogin()) {
                if (!::recyclerViewState.isInitialized) {
                    hole_recycler_view.handler.post {
                        holeAdapter.refresh()
                    }
                }
                safeThread {
                    activity?.getSharedPreferences(loggedInUser.userId, Context.MODE_PRIVATE)?.edit()?.run {
                        encrypt("h${loggedInUser.userId}", loggedInUser.holeToken).run {
                            putString("civ", first)
                            putString("cpe", second)
                        }
                        apply()
                    }
                }
            } else {
                hole_recycler_view.handler.post {
                    val input = HoleLogin()
                    AlertDialog.Builder(context)
                        .setTitle(please_enter_token)
                        .setView(input)
                        .setPositiveButton(confirm_string) { _, _ ->
                            loggedInUser.holeToken = input.token.text.toString()
                            validate()
                        }
                        .setNegativeButton(cancel_string) { _, _ ->
                            NavHostFragment.findNavController(this).navigateUp()
                        }
                        .setCancelable(false)
                        .show()
                }
            }
        }
    }

    private inner class HoleAdapter : Adapter<ViewHolder>() {
        private val data = mutableListOf<HoleTitleCard>()
        private var lastPage = 0

        private inner class HoleCardViewHolder(view: View) : ViewHolder(view) {
            val id: TextView = view.findViewById(R.id.hole_id_text)
            val time: TextView = view.findViewById(R.id.hole_time_text)
            val text: TextView = view.findViewById(R.id.hole_text_text)
        }

        fun fetch() {
            hole_swipe_refresh.isRefreshing = true
            safeThread {
                Network.getHoleList(lastPage + 1)?.run {
                    val lastSize = data.size
                    val lastId = data.lastOrNull()?.id ?: Int.MAX_VALUE
                    lastPage++
                    data.addAll(filter { it.id < lastId })
                    hole_swipe_refresh.handler.post {
                        hole_swipe_refresh.isRefreshing = false
                        notifyItemRangeChanged(lastSize, data.size)
                    }
                }
            }
        }

        fun refresh() {
            if (data.isNotEmpty()) {
                data.clear()
                lastPage = 0
                notifyDataSetChanged()
            }
            fetch()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            HoleCardViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_hole_card, parent, false))

        override fun getItemCount() = data.size

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder as HoleCardViewHolder
            val item = data[position]
            holder.id.text = "#${item.id}"
            holder.time.text = item.timeStamp.toString()
            holder.text.text = item.text
            holder.itemView.setOnClickListener {
                NavHostFragment.findNavController(this@HoleMainFragment).navigate(
                    R.id.holeCommentsFragment,
                    Bundle().apply { putInt("pid", item.id) }
                )
            }
        }
    }

    private inner class HoleLogin : LinearLayout(context) {
        val token: EditText = (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
            .inflate(R.layout.item_hole_login, this, true)
            .findViewById(R.id.hole_token_input)

    }

    override fun onPause() {
        hole_recycler_view.layoutManager?.onSaveInstanceState()?.run {
            recyclerViewState = this
        }
        super.onPause()
    }

}
