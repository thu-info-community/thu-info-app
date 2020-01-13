package com.unidy2002.thuinfo.data.model

import com.bin.david.form.annotation.SmartColumn
import com.bin.david.form.annotation.SmartTable

class EcardTable(
    val eCardList: MutableList<ECardElement> = mutableListOf()
) {
    @SmartTable(name = "消费明细表")
    class ECardElement(
        @field:SmartColumn(id = 0, name = "地点") private val locale: String,
        @field:SmartColumn(id = 1, name = "类型") private val category: String,
        @field:SmartColumn(id = 2, name = "日期") private val date: String,
        @field:SmartColumn(id = 3, name = "时间") private val time: String,
        @field:SmartColumn(id = 4, name = "金额") private val value: String
    )

    private fun isSpent(category: String): Boolean {
        return category.matches(Regex("消费|自助缴费.*|取消充值"))
    }

    var income: Double = 0.0
    var expenditure: Double = 0.0
    var remainder: Double = 0.0

    fun addElement(locale: String, category: String, date_time: String, value: Double) {
        date_time.split(' ').run {
            eCardList.add(
                ECardElement(
                    locale,
                    with(Regex("\\(.*\\)").find(category)) {
                        this?.value?.drop(1)?.dropLast(1) ?: category
                    },
                    this[0], this[1],
                    when (isSpent(category)) {
                        true -> {
                            expenditure += value
                            remainder -= value
                            String.format("-%.2f", value)
                        }
                        false -> {
                            income += value
                            remainder += value
                            String.format("+%.2f", value)
                        }
                    }
                )
            )
        }
    }
}