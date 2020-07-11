package com.unidy2002.thuinfo.data.model.report

data class ReportItem(
    val name: String,
    val credit: Int,
    val grade: String?,
    var point: Double?,
    val semester: String,
    val id: String
) {
    fun mapGPA(switch: Boolean) {
        if (switch) {
            point = when (grade) {
                "A-" -> 3.7
                "B+" -> 3.3
                "B" -> 3.0
                "B-" -> 2.7
                "C+" -> 2.3
                "C" -> 2.0
                "C-" -> 1.7
                "D+" -> 1.3
                "D" -> 1.0
                else -> point
            }
        }
    }
}