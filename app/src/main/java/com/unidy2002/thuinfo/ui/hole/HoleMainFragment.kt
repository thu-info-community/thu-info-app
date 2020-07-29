package com.unidy2002.thuinfo.ui.hole

import android.app.AlertDialog
import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import android.view.KeyEvent.ACTION_UP
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.RecyclerView.*
import com.unidy2002.thuinfo.MainActivity
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.hole.*
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.network.getHoleList
import com.unidy2002.thuinfo.data.network.holeLogin
import com.unidy2002.thuinfo.data.util.encrypt
import com.unidy2002.thuinfo.data.util.safePost
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_hole_main.*
import kotlin.math.min

class HoleMainFragment : Fragment() {

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_hole_main, container, false)

    private var holeAdapter = HoleAdapter()

    private var virgin = true

    private var lastTopPosition = 0

    var navigateDestination = Int.MAX_VALUE

    private var validating = false

    private var currentMode = FetchMode.NORMAL

    private var currentPayload = ""

    private var lastAutoFetchPos = -1

    override fun onStart() {
        super.onStart()

        hole_refresh_btn.setOnClickListener {
            holeAdapter.refresh(FetchMode.NORMAL)
        }

        hole_attention_btn.setOnClickListener {
            holeAdapter.refresh(FetchMode.ATTENTION)
        }

        hole_hot_btn.setOnClickListener {
            holeAdapter.refresh(FetchMode.SEARCH, "热榜")
        }

        hole_search_edit_text.setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == ACTION_UP) {
                holeAdapter.refresh(FetchMode.SEARCH, hole_search_edit_text.text.toString())
            }
            false
        }

        hole_new_post_btn.setOnClickListener {
            navigateDestination = Int.MAX_VALUE
            NavHostFragment.findNavController(this).navigate(R.id.holePostFragment)
        }

        hole_swipe_refresh.apply {
            setColorSchemeResources(R.color.colorAccent)
            setOnRefreshListener { holeAdapter.refresh() }
        }

        hole_recycler_view.apply {
            layoutManager = LinearLayoutManager(context).apply {
                scrollToPosition(lastTopPosition)
            }
            adapter = holeAdapter

            addOnScrollListener(object : RecyclerView.OnScrollListener() {
                override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
                    with(recyclerView.layoutManager as LinearLayoutManager) {
                        if (currentMode != FetchMode.ATTENTION &&
                            itemCount - findLastCompletelyVisibleItemPosition() <= 10 &&
                            lastAutoFetchPos < holeAdapter.itemCount &&
                            !hole_swipe_refresh.isRefreshing
                        ) {
                            lastAutoFetchPos = holeAdapter.itemCount
                            holeAdapter.fetch()
                        }
                    }
                }
            })
        }

        try {
            with(activity as MainActivity) {
                menu.removeItem(R.id.hole_logout)
                menu.removeItem(R.id.hole_copy_token)
                menuInflater.inflate(R.menu.hole_main_menu, menu)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        if (!validating) validate()
    }

    private fun validate() {
        validating = true
        hole_swipe_refresh.isRefreshing = true
        safeThread {
            if (loggedInUser.holeLoggedIn || holeLogin()) {
                loggedInUser.holeLoggedIn = true
                validating = false
                hole_recycler_view.handler.safePost { hole_swipe_refresh.isRefreshing = false }
                if (virgin) {
                    virgin = false
                    hole_recycler_view.handler.safePost {
                        holeAdapter.refresh()
                    }
                    safeThread {
                        activity?.getSharedPreferences(loggedInUser.userId, Context.MODE_PRIVATE)?.edit()?.run {
                            encrypt("h${loggedInUser.userId}", loggedInUser.holeToken).run {
                                putString("hiv", first)
                                putString("hpe", second)
                            }
                            apply()
                        }
                    }
                }
            } else {
                hole_recycler_view.handler.safePost {
                    hole_swipe_refresh.isRefreshing = false
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
                        .setOnDismissListener { validating = false }
                        .setCancelable(false)
                        .show()
                }
            }
        }
    }

    enum class FetchMode { NORMAL, ATTENTION, SEARCH }

    inner class HoleAdapter : Adapter<ViewHolder>() {
        private val data = mutableListOf<HoleTitleCard>()
        private var lastPage = 0

        inner class HoleCardViewHolder(view: View) : ViewHolder(view), HoleCardViewHolderInterface {
            override val id: TextView = view.findViewById(R.id.hole_id_text)
            override val tag: TextView = view.findViewById(R.id.hole_tag_text)
            override val time: TextView = view.findViewById(R.id.hole_time_text)
            override val text: TextView = view.findViewById(R.id.hole_text_text)
            override val image: ImageView = view.findViewById(R.id.hole_title_card_image)
            override val details: LinearLayout = view.findViewById(R.id.hole_to_be_hidden_part)
            val commentIcon: ImageView = view.findViewById(R.id.hole_comment_cnt_icon)
            val commentCnt: TextView = view.findViewById(R.id.hole_comment_cnt_text)
            val starIcon: ImageView = view.findViewById(R.id.hole_star_cnt_icon)
            val starCnt: TextView = view.findViewById(R.id.hole_star_cnt_text)
            /* val quoteLine: View = view.findViewById(R.id.hole_line_below_quote)
            val quoteText: TextView = view.findViewById(R.id.hole_quote_text) */
        }

        fun fetch(mode: FetchMode = currentMode, payload: String = currentPayload) {
            hole_swipe_refresh.isRefreshing = true
            safeThread {
                getHoleList(mode, lastPage + 1, payload)?.run {
                    val lastSize = data.size
                    lastPage++
                    if (mode == FetchMode.NORMAL) {
                        with(data.lastOrNull()?.id ?: Int.MAX_VALUE) { data.addAll(filter { it.id < this }) }
                    } else {
                        data.addAll(this)
                    }
                    if (data.size > lastSize) {
                        hole_swipe_refresh.handler.safePost {
                            notifyItemRangeChanged(lastSize, data.size)
                        }
                    }
                }
                hole_swipe_refresh.handler.safePost {
                    hole_swipe_refresh.isRefreshing = false
                }
            }
        }

        fun refresh(mode: FetchMode = currentMode, payload: String = currentPayload) {
            currentMode = mode
            currentPayload = payload
            if (data.isNotEmpty()) {
                data.clear()
                notifyDataSetChanged()
            }
            lastPage = 0
            lastAutoFetchPos = -1
            fetch(mode, payload)
        }

        private fun getCurrentPosition(id: Int) = data.indexOfFirst { it.id == id }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            HoleCardViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_hole_card, parent, false))

        override fun getItemCount() = data.size

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = data[position]
            (holder as HoleCardViewHolder).bind(context, this@HoleMainFragment, item, ::getCurrentPosition)
            // holder.text.maxLines = 9
            holder.itemView.setOnClickListener {
                navigateDestination = getCurrentPosition(item.id)
                NavHostFragment.findNavController(this@HoleMainFragment).navigate(
                    R.id.holeCommentsFragment,
                    Bundle().apply { putInt("pid", item.id) }
                )
            }
            holder.itemView.setOnLongClickListener {
                context?.run {
                    LongClickSelectDialog(this, item.type == "image", true) { index ->
                        val pressedPosition = getCurrentPosition(item.id)
                        when (index) {
                            0 -> copyUtil(this, item.text)
                            1 -> saveImgUtil(this, hole_swipe_refresh.handler, item)
                            2 -> {
                                loggedInUser.holeIgnore.addIgnoreP(item.id)
                                data.removeAt(pressedPosition)
                                notifyItemRemoved(pressedPosition)
                            }
                        }
                    }
                }
                true
            }
        }
    }

    private inner class HoleLogin : LinearLayout(context) {
        val token: EditText = (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
            .inflate(R.layout.item_hole_login, this, true)
            .findViewById(R.id.hole_token_input)
    }

    override fun onPause() {
        super.onPause()
        try {
            (activity as MainActivity).menu.clear()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        (hole_recycler_view.layoutManager as? LinearLayoutManager)?.run {
            val firstVisible = findFirstCompletelyVisibleItemPosition()
            lastTopPosition =
                if (firstVisible == NO_POSITION) navigateDestination else min(navigateDestination, firstVisible)
        }
    }
}