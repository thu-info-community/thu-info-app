package com.unidy2002.thuinfo.data.model.report

data class CourseScore(
    val name: String,
    val credit: Int,
    val grade: String?,
    val point: Double?,
    val semester: String
)