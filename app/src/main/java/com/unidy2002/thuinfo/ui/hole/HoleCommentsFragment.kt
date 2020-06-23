package com.unidy2002.thuinfo.ui.hole

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView.Adapter
import androidx.recyclerview.widget.RecyclerView.ViewHolder
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.hole.HoleCard
import com.unidy2002.thuinfo.data.model.hole.HoleCommentCard
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getHoleComments
import com.unidy2002.thuinfo.data.network.postHoleComment
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_hole_comments.*

class HoleCommentsFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_hole_comments, container, false)

    private var pid = 0

    private val holeCommentsAdapter = HoleCommentsAdapter()

    override fun onStart() {
        super.onStart()

        with(arguments?.getInt("pid")) {
            if (this == null) {
                context?.run { Toast.makeText(this, load_fail_string, Toast.LENGTH_SHORT).show() }
                NavHostFragment.findNavController(this@HoleCommentsFragment).navigateUp()
                return
            }
            pid = this
            (activity as? AppCompatActivity)?.supportActionBar?.title = "#$this"

            hole_comments_refresh.apply {
                setColorSchemeResources(R.color.colorAccent)
                setOnRefreshListener { holeCommentsAdapter.refresh() }
            }

            hole_comments_recycler_view.apply {
                layoutManager = LinearLayoutManager(context)
                adapter = holeCommentsAdapter.also { it.refresh() }
            }

            hole_comment_edit_text.doOnTextChanged { text, _, _, _ ->
                hole_comment_submit.isEnabled = !text.isNullOrBlank()
            }

            hole_comment_submit.run {
                setOnClickListener {
                    isEnabled = false
                    safeThread {
                        if (Network.postHoleComment(pid, hole_comment_edit_text.text.toString())) {
                            handler.post {
                                holeCommentsAdapter.refresh()
                                context?.run { Toast.makeText(this, hole_publish_success, Toast.LENGTH_SHORT).show() }
                                hole_comment_edit_text.setText("")
                                isEnabled = true
                            }
                        } else {
                            handler.post {
                                context?.run { Toast.makeText(this, hole_publish_failure, Toast.LENGTH_SHORT).show() }
                                isEnabled = true
                            }
                        }
                    }
                }
            }
        }
    }

    private inner class HoleCommentsAdapter : Adapter<ViewHolder>() {
        private val data = mutableListOf<HoleCard>()

        private inner class HoleCardViewHolder(view: View) : ViewHolder(view) {
            val id: TextView = view.findViewById(R.id.hole_id_text)
            val time: TextView = view.findViewById(R.id.hole_time_text)
            val text: TextView = view.findViewById(R.id.hole_text_text)
        }

        fun refresh() {
            hole_comments_refresh.run {
                isRefreshing = true
                safeThread {
                    Network.getHoleComments(pid)?.run {
                        if (data.isNotEmpty()) data.clear()
                        data.addAll(this)
                        handler.post { notifyDataSetChanged() }
                    }
                    isRefreshing = false
                }
            }
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
                with(hole_comment_edit_text.text.toString()) {
                    if (isBlank() || trim().matches(Regex("Re [A-Za-z]*:")))
                        hole_comment_edit_text.setText("Re ${if (item is HoleCommentCard) item.name else ""}: ")
                }
            }
        }
    }
}
