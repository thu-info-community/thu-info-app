package com.unidy2002.thuinfo.ui.hole

import android.app.AlertDialog
import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.view.*
import android.view.KeyEvent.ACTION_UP
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.RecyclerView.*
import androidx.recyclerview.widget.RecyclerView.Adapter
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.hole.HoleCardViewHolderInterface
import com.unidy2002.thuinfo.data.model.hole.HoleTitleCard
import com.unidy2002.thuinfo.data.model.hole.bind
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getHoleList
import com.unidy2002.thuinfo.data.network.holeLogin
import com.unidy2002.thuinfo.data.util.encrypt
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_hole_main.*
import kotlin.math.min

class HoleMainFragment : Fragment() {

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_hole_main, container, false)

    private var holeAdapter = HoleAdapter()

    private var virgin = true

    private var lastTopPosition = 0

    private var navigateDestination = Int.MAX_VALUE

    private var validating = false

    private var normalMode = true

    override fun onStart() {
        super.onStart()

        hole_refresh_btn.setOnClickListener {
            normalMode = true
            if (!hole_swipe_refresh.isRefreshing)
                holeAdapter.refresh()
        }

        hole_attention_btn.setOnClickListener {
            normalMode = false
            holeAdapter.refresh(FetchMode.ATTENTION)
        }

        hole_hot_btn.setOnClickListener {
            normalMode = false
            holeAdapter.refresh(FetchMode.SEARCH, "热榜")
        }

        hole_search_edit_text.setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == ACTION_UP) {
                normalMode = false
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
            setOnRefreshListener {
                normalMode = true
                holeAdapter.refresh()
            }
        }

        hole_recycler_view.apply {
            layoutManager = LinearLayoutManager(context).apply {
                scrollToPosition(lastTopPosition)
            }
            adapter = holeAdapter

            addOnScrollListener(object : RecyclerView.OnScrollListener() {
                override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
                    with(recyclerView.layoutManager as LinearLayoutManager) {
                        if (normalMode && itemCount - findLastCompletelyVisibleItemPosition() <= 10 && !hole_swipe_refresh.isRefreshing)
                            holeAdapter.fetch(FetchMode.NORMAL, "")
                    }
                }
            })
        }

        if (!validating) validate()
    }

    private fun validate() {
        validating = true
        hole_swipe_refresh.isRefreshing = true
        safeThread {
            if (loggedInUser.holeLoggedIn || Network.holeLogin()) {
                loggedInUser.holeLoggedIn = true
                validating = false
                hole_recycler_view.handler.post { hole_swipe_refresh.isRefreshing = false }
                if (virgin) {
                    virgin = false
                    hole_recycler_view.handler.post {
                        normalMode = true
                        holeAdapter.refresh()
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
                }
            } else {
                hole_recycler_view.handler.post {
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

    // TODO: search mode is incompletely implemented (i.e. no auto load more)
    private enum class FetchMode { NORMAL, ATTENTION, SEARCH }

    private inner class HoleAdapter : Adapter<ViewHolder>() {
        private val data = mutableListOf<HoleTitleCard>()
        private var lastPage = 0

        private inner class HoleCardViewHolder(view: View) : ViewHolder(view), HoleCardViewHolderInterface {
            override val id: TextView = view.findViewById(R.id.hole_id_text)
            override val tag: TextView = view.findViewById(R.id.hole_tag_text)
            override val time: TextView = view.findViewById(R.id.hole_time_text)
            override val text: TextView = view.findViewById(R.id.hole_text_text)
            override val image: ImageView = view.findViewById(R.id.hole_title_card_image)
            val commentIcon: ImageView = view.findViewById(R.id.hole_comment_cnt_icon)
            val commentCnt: TextView = view.findViewById(R.id.hole_comment_cnt_text)
        }

        fun fetch(mode: FetchMode, payload: String) {
            hole_swipe_refresh.isRefreshing = true
            safeThread {
                Network.getHoleList(
                    when (mode) {
                        FetchMode.NORMAL -> lastPage + 1
                        FetchMode.ATTENTION -> -1
                        FetchMode.SEARCH -> -2
                    },
                    payload
                )?.run {
                    if (mode == FetchMode.NORMAL) {
                        val lastSize = data.size
                        val lastId = data.lastOrNull()?.id ?: Int.MAX_VALUE
                        lastPage++
                        data.addAll(filter { it.id < lastId })
                        hole_swipe_refresh.handler.post {
                            notifyItemRangeChanged(lastSize, data.size)
                        }
                    } else {
                        data.addAll(this)
                        hole_swipe_refresh.handler.post {
                            notifyDataSetChanged()
                        }
                    }
                }
                hole_swipe_refresh.handler.post {
                    hole_swipe_refresh.isRefreshing = false
                }
            }
        }

        fun refresh(mode: FetchMode = FetchMode.NORMAL, payload: String = "") {
            if (data.isNotEmpty()) {
                data.clear()
                notifyDataSetChanged()
            }
            lastPage = 0
            fetch(mode, payload)
        }

        private fun getCurrentPosition(id: Int) = data.indexOfFirst { it.id == id }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            HoleCardViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_hole_card, parent, false))

        override fun getItemCount() = data.size

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = data[position]
            (holder as HoleCardViewHolder).bind(context, item)
            holder.itemView.setOnClickListener {
                navigateDestination = getCurrentPosition(item.id)
                NavHostFragment.findNavController(this@HoleMainFragment).navigate(
                    R.id.holeCommentsFragment,
                    Bundle().apply { putInt("pid", item.id) }
                )
            }
            holder.itemView.setOnLongClickListener {
                context?.run {
                    LongClickSelectDialog(this) {
                        val pressedPosition = getCurrentPosition(item.id)
                        if (it == 0) {
                            loggedInUser.holeIgnore.addIgnoreP(item.id)
                            data.removeAt(pressedPosition)
                            notifyItemRemoved(pressedPosition)
                        }
                    }
                }
                true
            }
            if (item.reply > 0) {
                holder.commentIcon.visibility = View.VISIBLE
                holder.commentCnt.visibility = View.VISIBLE
                holder.commentCnt.text = item.reply.toString()
            } else {
                holder.commentIcon.visibility = View.GONE
                holder.commentCnt.visibility = View.GONE
            }
        }
    }

    private inner class HoleLogin : LinearLayout(context) {
        val token: EditText = (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
            .inflate(R.layout.item_hole_login, this, true)
            .findViewById(R.id.hole_token_input)
    }

    // UI with great thanks to `com.wildma.pictureselector`
    private inner class LongClickSelectDialog(context: Context, onClick: (Int) -> Unit) :
        Dialog(context, R.style.HoleSelectDialogStyle), View.OnClickListener {

        lateinit var ignore: Button
        lateinit var cancel: Button

        val listener = object : OnItemClickListener {
            override fun onItemClick(type: Int) {
                onClick(type)
            }
        }

        init {
            window?.run {
                decorView.setPadding(0, 0, 0, 0)
                setGravity(Gravity.RELATIVE_LAYOUT_DIRECTION or Gravity.BOTTOM)
                attributes = attributes.apply {
                    width = WindowManager.LayoutParams.MATCH_PARENT
                    height = WindowManager.LayoutParams.WRAP_CONTENT
                }
                setCanceledOnTouchOutside(false)
                show()
            }
        }

        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            setContentView(R.layout.dialog_hole_select)

            ignore = findViewById(R.id.hole_ignore_btn)
            cancel = findViewById(R.id.hole_select_cancel_btn)
            ignore.setOnClickListener(this)
            cancel.setOnClickListener(this)

            setOnKeyListener { _, keyCode, event ->
                if (keyCode == KeyEvent.KEYCODE_BACK && event.action == ACTION_UP) {
                    hideDialog()
                    listener.onItemClick(-1)
                }
                false
            }
        }

        override fun onClick(v: View) {
            when (v.id) {
                R.id.hole_ignore_btn -> {
                    hideDialog()
                    listener.onItemClick(0)
                }
                R.id.hole_select_cancel_btn -> {
                    hideDialog()
                    listener.onItemClick(-1)
                }
            }
        }

        override fun onTouchEvent(event: MotionEvent): Boolean {
            if (isOutOfBounds(context, event)) {
                hideDialog()
                listener.onItemClick(-1)
            }
            return super.onTouchEvent(event)
        }

        private fun hideDialog() {
            cancel()
            dismiss()
        }

        private fun isOutOfBounds(context: Context, event: MotionEvent) = try {
            val x = event.x.toInt()
            val y = event.y.toInt()
            val slop = ViewConfiguration.get(context).scaledWindowTouchSlop
            val decorView = window!!.decorView
            x < -slop || y < -slop || x > decorView.width + slop || y > decorView.height + slop
        } catch (e: Exception) {
            false
        }
    }

    interface OnItemClickListener {
        fun onItemClick(type: Int)
    }

    override fun onPause() {
        super.onPause()
        (hole_recycler_view.layoutManager as? LinearLayoutManager)?.run {
            val firstVisible = findFirstCompletelyVisibleItemPosition()
            lastTopPosition =
                if (firstVisible == NO_POSITION) navigateDestination else min(navigateDestination, firstVisible)
        }
    }

}
