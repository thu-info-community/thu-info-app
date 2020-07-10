package com.unidy2002.thuinfo.data.model.report

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.ui.home.ReportFragment

class ReportAdapter(
    private val originalReportList: List<ReportItem>,
    private val mode: ReportFragment.Mode,
    private var customOriginal: Boolean = true
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val reportList get() = if (mode == ReportFragment.Mode.CUSTOM) genCustom() else originalReportList

    open class CardViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        var grade: ImageView = view.findViewById(R.id.report_card_image)
        var courseName: TextView = view.findViewById(R.id.report_course_name)
        var courseCredit: TextView = view.findViewById(R.id.report_course_credit)
        var coursePoint: TextView = view.findViewById(R.id.report_course_point)
    }

    class CardViewWithSemesterHolder(view: View) : CardViewHolder(view) {
        var semester: TextView = view.findViewById(R.id.semester_tag)
        var semesterGPA: TextView = view.findViewById(R.id.semester_gpa)
    }

    class CardFooter(view: View) : RecyclerView.ViewHolder(view) {
        var gpa: TextView = view.findViewById(R.id.total_gpa)
    }

    override fun getItemViewType(position: Int) =
        if (position == itemCount - 1)
            2
        else if (position == 0 || reportList[position].semester != reportList[position - 1].semester)
            1
        else
            0

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder =
        when (viewType) {
            2 ->
                CardFooter(
                    LayoutInflater.from(parent.context).inflate(R.layout.item_report_card_footer, parent, false)
                )
            1 ->
                CardViewWithSemesterHolder(
                    LayoutInflater.from(parent.context).inflate(R.layout.item_report_card_with_semester, parent, false)
                )
            else ->
                CardViewHolder(
                    LayoutInflater.from(parent.context).inflate(R.layout.item_report_card, parent, false)
                )
        }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        if (position == itemCount - 1) {
            (holder as CardFooter).gpa.text =
                reportList.filter { it.point != null }.run {
                    val credits = sumBy { it.credit }
                    val points = sumByDouble { it.point!! * it.credit }
                    if (points == 0.0) "N/A" else String.format("%.3f", points / credits)
                }
        } else {
            val cardViewHolder = holder as CardViewHolder
            val scoreCard = reportList[position]
            cardViewHolder.grade.setImageResource(
                when (scoreCard.grade) {
                    "A+" -> R.drawable.a_plus
                    "A" -> R.drawable.a_sharp
                    "A-" -> R.drawable.a_minus
                    "B+" -> R.drawable.b_plus
                    "B" -> R.drawable.b_sharp
                    "B-" -> R.drawable.b_minus
                    "C+" -> R.drawable.c_plus
                    "C" -> R.drawable.c_sharp
                    "C-" -> R.drawable.c_minus
                    "D+" -> R.drawable.d_plus
                    "D" -> R.drawable.d_sharp
                    "F" -> R.drawable.fail
                    "P" -> R.drawable.pass
                    "W" -> R.drawable.withdrew
                    "I" -> R.drawable.incomplete
                    "EX" -> R.drawable.exempted
                    else -> R.drawable.unknown
                }
            )
            cardViewHolder.courseName.text = scoreCard.name
            cardViewHolder.courseCredit.text = scoreCard.credit.toString()
            if (scoreCard.point == null) {
                cardViewHolder.coursePoint.text = "N/A"
                cardViewHolder.coursePoint.textSize = 18F
            } else {
                cardViewHolder.coursePoint.text = scoreCard.point.toString()
            }
            if (getItemViewType(position) == 1) {
                val cardViewWithSemesterHolder = cardViewHolder as CardViewWithSemesterHolder
                cardViewWithSemesterHolder.semester.text = scoreCard.semester
                cardViewWithSemesterHolder.semesterGPA.text =
                    reportList.filter { it.semester == scoreCard.semester && it.point != null }.run {
                        val credits = sumBy { it.credit }
                        val points = sumByDouble { it.point!! * it.credit }
                        if (points == 0.0) "N/A" else String.format("%.3f", points / credits)
                    }
            }
        }
    }

    override fun getItemCount() = reportList.size + 1

    private fun genCustom() =
        if (customOriginal) originalReportList.filter { !loggedInUser.reportIgnore.hasIgnoreP(it.id) }
        else originalReportList.filter { loggedInUser.reportIgnore.hasIgnoreP(it.id) }

    fun toggle() {
        customOriginal = !customOriginal
        notifyDataSetChanged()
    }

    fun toggle(position: Int) {
        if (position < reportList.size) {
            if (customOriginal)
                loggedInUser.reportIgnore.addIgnoreP(reportList[position].id)
            else
                loggedInUser.reportIgnore.removeIgnoreP(reportList[position].id)
        }
        notifyDataSetChanged()
    }
}