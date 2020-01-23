package com.unidy2002.thuinfo.data.model.report

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R

class ReportAdapter(private val reportList: List<ReportItem>) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    open class CardViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        var grade: ImageView = view.findViewById(R.id.report_card_image)
        var courseName: TextView = view.findViewById(R.id.report_course_name)
        var courseCredit: TextView = view.findViewById(R.id.report_course_credit)
        var coursePoint: TextView = view.findViewById(R.id.report_course_point)
    }

    class CardViewWithSemesterHolder(view: View) : CardViewHolder(view) {
        var semester: TextView = view.findViewById(R.id.semester_tag)
    }

    override fun getItemViewType(position: Int) =
        if (position == 0 || reportList[position].semester != reportList[position - 1].semester) 1 else 0

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder =
        if (viewType == 1)
            CardViewWithSemesterHolder(
                LayoutInflater.from(parent.context).inflate(R.layout.item_report_card_with_semester, parent, false)
            )
        else
            CardViewHolder(
                LayoutInflater.from(parent.context).inflate(R.layout.item_report_card, parent, false)
            )

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
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
        }
    }

    override fun getItemCount() = reportList.size
}