package com.unidy2002.thuinfo.data.model.tables

import com.bin.david.form.annotation.SmartColumn
import com.bin.david.form.annotation.SmartTable

@SmartTable(name = "阳光长跑成绩记录")
class JoggingRecord(
    @field:SmartColumn(id = 0, name = "学期") private val semester: String,
    @field:SmartColumn(id = 1, name = "次数") private val count: Int,
    @field:SmartColumn(id = 2, name = "路程") private val length: Int,
    @field:SmartColumn(id = 3, name = "得分") private val score: Int
)