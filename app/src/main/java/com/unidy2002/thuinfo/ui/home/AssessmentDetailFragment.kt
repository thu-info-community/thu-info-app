package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.children
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.Observer
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.assessment.*
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getAssessmentForm
import com.unidy2002.thuinfo.data.network.postAssessmentForm
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_assessment_detail.*

class AssessmentDetailFragment : Fragment() {

    private val healthy = MutableLiveData(true)

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_assessment_detail, container, false)

    override fun onStart() {
        super.onStart()

        with(arguments?.getString("url", "")) {
            if (this == null || isBlank()) {
                healthy.postValue(false)
            } else {
                safeThread {
                    val result = Network.getAssessmentForm(this)
                    assessment_detail_loading.handler.post {
                        if (result == null) {
                            healthy.postValue(false)
                        } else {
                            context?.run {
                                assessment_detail_loading.visibility = View.GONE
                                assessment_detail_recycler_view.apply {
                                    setItemViewCacheSize(1000) // TODO: Any better approach?
                                    layoutManager = LinearLayoutManager(this@run)
                                    adapter = Adapter(result)
                                }
                            }
                        }
                    }
                }
            }
        }

        with(arguments?.getString("title", "")) {
            if (this == null) {
                healthy.postValue(false)
            } else {
                (activity as? AppCompatActivity)?.supportActionBar?.title = this
            }
        }

        healthy.observe(this, Observer {
            if (it != true) {
                context?.run { Toast.makeText(this, network_error_retry, Toast.LENGTH_SHORT).show() }
                NavHostFragment.findNavController(this).navigateUp()
            }
        })
    }

    private inner class Adapter(private val form: Form) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

        // 0: Overall; 1: Teacher; 2: Assistant; 3: Hint;
        // 4: Name; 5: Rating; 6: Suggestion; 7: Submit
        private val typeList = (if (form.teachers.isEmpty()) listOf(0, 5, 6) else listOf(0, 5, 6, 1)) +
                form.teachers.flatMap { listOf(4) + List(it.inputGroups.size) { 5 } + 6 } +
                when (form.assistants.size) {
                    0 -> emptyList()
                    1 -> listOf(2)
                    else -> listOf(2, 3)
                } +
                form.assistants.flatMap { listOf(4) + List(it.inputGroups.size) { 5 } + 6 } +
                7

        private val referenceList: List<Any> = listOf(0) + form.overall.score + form.overall +
                (if (form.teachers.isEmpty()) emptyList() else listOf(0)) +
                form.teachers.flatMap { listOf(it) + it.inputGroups + it } +
                List(
                    when (form.assistants.size) {
                        0 -> 0
                        1 -> 1
                        else -> 2
                    }
                ) { 0 } +
                form.assistants.flatMap { listOf(it) + it.inputGroups + it } +
                0

        private inner class SimpleTextViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val title: TextView = view.findViewById(R.id.assessment_simple_text)

            lateinit var capturedPerson: Person

            init {
                itemView.setOnLongClickListener {
                    if (::capturedPerson.isInitialized) {
                        capturedPerson.autoScore()
                        notifyDataSetChanged()
                    }
                    true
                }
            }
        }

        private inner class RatingViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val question: TextView = view.findViewById(R.id.assessment_question_text)

            private val stars = view.findViewById<GridView>(R.id.assessment_rating_grid).children.toList()

            lateinit var capturedInputTag: InputTag

            val rating = MutableLiveData(0)

            init {
                stars.forEachIndexed { index, item ->
                    item.setOnClickListener {
                        rating.postValue(index + 1)
                    }
                }
                rating.observe(this@AssessmentDetailFragment, Observer {
                    stars.forEachIndexed { index, item ->
                        (item as? ImageView)?.setImageDrawable(
                            resources.getDrawable(
                                if (index < it) R.drawable.ic_star_32dp else R.drawable.ic_star_border_32dp,
                                null
                            )
                        )
                    }
                    if (::capturedInputTag.isInitialized)
                        capturedInputTag.value = it.toString()
                })
            }
        }

        private inner class SuggestionViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val suggestion: EditText = view.findViewById(R.id.assessment_suggestion_edit_text)

            lateinit var capturedSuggestional: Suggestional

            init {
                suggestion.doOnTextChanged { text, _, _, _ ->
                    if (::capturedSuggestional.isInitialized)
                        capturedSuggestional.suggestionText = (text ?: "").toString()
                }
            }
        }

        private inner class SubmitViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val submit: Button = view.findViewById(R.id.assessment_submit_btn)
        }

        override fun getItemViewType(position: Int) = typeList[position]

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = when (viewType) {
            3 -> SimpleTextViewHolder(
                LayoutInflater.from(parent.context).inflate(R.layout.item_assessment_hint, parent, false)
            )
            4 -> SimpleTextViewHolder(
                LayoutInflater.from(parent.context).inflate(R.layout.item_assessment_subtitle, parent, false)
            )
            5 -> RatingViewHolder(
                LayoutInflater.from(parent.context).inflate(R.layout.item_assessment_rating, parent, false)
            )
            6 -> SuggestionViewHolder(
                LayoutInflater.from(parent.context).inflate(R.layout.item_assessment_suggestion, parent, false)
            )
            7 -> SubmitViewHolder(
                LayoutInflater.from(parent.context).inflate(R.layout.item_assessment_submit, parent, false)
            )
            else -> SimpleTextViewHolder(
                LayoutInflater.from(parent.context).inflate(R.layout.item_assessment_title, parent, false)
            )
        }

        override fun getItemCount() = typeList.size

        override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
            val type = typeList[position]
            val reference = referenceList[position]
            when (holder) {
                is SimpleTextViewHolder -> {
                    holder.title.text = when (type) {
                        0 -> getString(assess_overall_str)
                        1 -> getString(assess_teacher_str)
                        2 -> getString(assess_assistant_str)
                        3 -> getString(assess_assistant_hint_str)
                        else -> if (reference is Person) reference.also { holder.capturedPerson = it }.name else ""
                    }
                }
                is RatingViewHolder -> {
                    holder.question.text = when (reference) {
                        is InputTag -> {
                            holder.capturedInputTag = reference
                            holder.question.visibility = View.GONE
                            ""
                        }
                        is InputGroup -> {
                            holder.capturedInputTag = reference.score
                            holder.question.visibility = View.VISIBLE
                            reference.question
                        }
                        else -> {
                            healthy.postValue(false)
                            return
                        }
                    }
                    try {
                        holder.rating.postValue(holder.capturedInputTag.value.toInt())
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                is SuggestionViewHolder -> {
                    if (reference is Suggestional) {
                        holder.capturedSuggestional = reference
                        holder.suggestion.setText(reference.suggestionText)
                    } else {
                        healthy.postValue(false)
                    }
                }
                is SubmitViewHolder -> {
                    holder.submit.setOnClickListener {
                        it.isEnabled = false
                        val message = form.invalid()
                        if (message == null) {
                            safeThread {
                                val result = Network.postAssessmentForm(form.serialize())
                                it.handler.post {
                                    context?.run {
                                        Toast.makeText(
                                            this,
                                            if (result == null) send_fail_string else send_succeed_string,
                                            Toast.LENGTH_SHORT
                                        ).show()
                                    }
                                }
                            }
                        } else {
                            context?.run { Toast.makeText(this, message, Toast.LENGTH_SHORT).show() }
                        }
                        it.isEnabled = true
                    }
                }
                else -> healthy.postValue(false)
            }
        }
    }
}
