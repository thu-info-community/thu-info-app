package com.unidy2002.thuinfo.ui.hole

import android.app.AlertDialog
import android.content.Context
import android.os.Bundle
import android.os.Parcelable
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.core.view.get
import androidx.core.view.isEmpty
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView.Adapter
import androidx.recyclerview.widget.RecyclerView.ViewHolder
import com.unidy2002.thuinfo.MainActivity
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.hole.*
import com.unidy2002.thuinfo.data.network.getHoleComments
import com.unidy2002.thuinfo.data.network.postHoleComment
import com.unidy2002.thuinfo.data.network.postHoleReport
import com.unidy2002.thuinfo.data.network.setHoleAttention
import com.unidy2002.thuinfo.data.util.safePost
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_hole_comments.*

class HoleCommentsFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_hole_comments, container, false)

    private var pid = 0

    private var attention = false

    private val holeCommentsAdapter = HoleCommentsAdapter()

    private lateinit var recyclerViewState: Parcelable

    fun toggleAttention() {
        safeThread {
            setHoleAttention(pid, !attention)?.run {
                attention = this
                try {
                    hole_comment_submit?.handler?.safePost {
                        (activity as MainActivity).menu[1].icon = context?.getDrawable(
                            if (attention) R.drawable.ic_star_has_attention
                            else R.drawable.ic_star_not_attention
                        )
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()

        with(arguments?.getInt("pid")) {
            if (this == null) {
                context?.run { Toast.makeText(this, load_fail_string, Toast.LENGTH_SHORT).show() }
                NavHostFragment.findNavController(this@HoleCommentsFragment).navigateUp()
            } else {
                pid = this

                hole_comments_refresh.apply {
                    setColorSchemeResources(R.color.colorAccent)
                    setOnRefreshListener { holeCommentsAdapter.refresh() }
                }

                hole_comments_recycler_view.apply {
                    layoutManager = LinearLayoutManager(context)
                    adapter = holeCommentsAdapter.also { it.refresh(::recyclerViewState.isInitialized) }
                }

                hole_comment_edit_text.doOnTextChanged { text, _, _, _ ->
                    hole_comment_submit.isEnabled = !text.isNullOrBlank()
                }

                hole_comment_submit.run {
                    setOnClickListener {
                        isEnabled = false
                        safeThread {
                            if (postHoleComment(pid, hole_comment_edit_text.text.toString())) {
                                handler.safePost {
                                    holeCommentsAdapter.refresh()
                                    context?.run {
                                        Toast.makeText(this, hole_publish_success, Toast.LENGTH_SHORT).show()
                                    }
                                    hole_comment_edit_text.setText("")
                                    isEnabled = true
                                }
                            } else {
                                handler.safePost {
                                    context?.run {
                                        Toast.makeText(this, hole_publish_failure, Toast.LENGTH_SHORT).show()
                                    }
                                    isEnabled = true
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onPause() {
        super.onPause()
        try {
            with(activity as MainActivity) {
                menu.removeItem(R.id.hole_support_like)
                menu.removeItem(R.id.hole_support_report)
                holeCommentsFragment = null
            }
            recyclerViewState = hole_comments_recycler_view.layoutManager!!.onSaveInstanceState()!!
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    inner class HoleCommentsAdapter : Adapter<ViewHolder>() {
        private val data = mutableListOf<HoleCard>()

        inner class HoleCardViewHolder(view: View) : ViewHolder(view), HoleCardViewHolderInterface {
            override val id: TextView = view.findViewById(R.id.hole_id_text)
            override val tag: TextView = view.findViewById(R.id.hole_tag_text)
            override val time: TextView = view.findViewById(R.id.hole_time_text)
            override val text: TextView = view.findViewById(R.id.hole_text_text)
            override val image: ImageView = view.findViewById(R.id.hole_title_card_image)
            override val details: LinearLayout = view.findViewById(R.id.hole_to_be_hidden_part)
        }

        fun refresh(restore: Boolean = false) {
            hole_comments_refresh.run {
                isRefreshing = true
                safeThread {
                    getHoleComments(pid)?.run {
                        if (data.isNotEmpty()) data.clear()
                        data.addAll(second)
                        attention = first
                        handler.safePost {
                            notifyDataSetChanged()
                            try {
                                with(activity as MainActivity) {
                                    if (menu.isEmpty()) {
                                        menuInflater.inflate(R.menu.hole_support_menu, menu)
                                        menu[1].icon = context.getDrawable(
                                            if (attention) R.drawable.ic_star_has_attention
                                            else R.drawable.ic_star_not_attention
                                        )
                                        holeCommentsFragment = this@HoleCommentsFragment
                                    }
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    }
                    handler.safePost {
                        isRefreshing = false
                        if (restore) {
                            try {
                                hole_comments_recycler_view.layoutManager?.onRestoreInstanceState(recyclerViewState)
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    }
                }
            }
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            HoleCardViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_hole_card, parent, false))

        override fun getItemCount() = data.size

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = data[position]
            (holder as HoleCardViewHolder).bind(context, this@HoleCommentsFragment, item) { position }
            holder.itemView.setOnClickListener {
                with(hole_comment_edit_text.text.toString()) {
                    if (isBlank() || trim().matches(Regex("Re (?:|洞主|(?:[A-Z][a-z]+ )?(?:[A-Z][a-z]+)|You Win(?: \\d+)?):")))
                        hole_comment_edit_text.setText("Re ${if (item is HoleCommentCard) item.name else ""}: ")
                }
            }
            holder.itemView.setOnLongClickListener {
                context?.run {
                    LongClickSelectDialog(this, item is HoleTitleCard && item.type == "image", false) { index ->
                        when (index) {
                            0 -> copyUtil(this, item.text)
                            1 -> if (item is HoleTitleCard) saveImgUtil(this, hole_comments_refresh.handler, item)
                        }
                    }
                }
                true
            }
        }
    }

    fun doReport() {
        val input = HoleReportConfigLayout()
        AlertDialog.Builder(context)
            .setTitle(hole_report_str)
            .setView(input)
            .setPositiveButton(confirm_string) { _, _ ->
                safeThread {
                    if (postHoleReport(pid, input.reason.text.toString())) {
                        hole_comment_submit.handler.safePost {
                            Toast.makeText(context, hole_report_success, Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        hole_comment_submit.handler.safePost {
                            Toast.makeText(context, hole_report_failure, Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
            .setNegativeButton(cancel_string) { _, _ -> }
            .show()
    }

    private inner class HoleReportConfigLayout : LinearLayout(context) {
        val reason: EditText = (context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater)
            .inflate(R.layout.item_hole_report_reason, this, true)
            .findViewById(R.id.hole_report_input)
    }
}
