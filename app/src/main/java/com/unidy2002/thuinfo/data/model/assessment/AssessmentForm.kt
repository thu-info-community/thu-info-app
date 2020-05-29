package com.unidy2002.thuinfo.data.model.assessment

import androidx.annotation.StringRes
import com.unidy2002.thuinfo.R.string.*
import org.jsoup.nodes.Element

data class InputTag(private val name: String, var value: String) {
    constructor(input: Element) : this(input.attr("name"), input.attr("value"))

    fun toPair() = Pair(name, value)

    fun outOfRange() = value.toInt() !in 1..7
}

data class InputGroup(val question: String, val suggestion: InputTag, val score: InputTag, val others: List<InputTag>)

interface Suggestional {
    var suggestionText: String

    fun updateSuggestion()

    fun translate(): List<Pair<String, String>>

    fun toPairs(): List<Pair<String, String>> {
        updateSuggestion()
        return translate()
    }
}

data class Overall(private val suggestion: InputTag, val score: InputTag, override var suggestionText: String = "") :
    Suggestional {

    override fun updateSuggestion() {
        suggestion.value = suggestionText
    }

    override fun translate() = listOf(suggestion.toPair(), score.toPair())

    init {
        suggestionText = suggestion.value // TODO: There seems to be bug here.
    }
}

data class Person(val name: String, val inputGroups: List<InputGroup>, override var suggestionText: String = "") :
    Suggestional {

    fun autoScore(score: Int = 7) {
        inputGroups.forEach { it.score.value = score.toString() }
    }

    fun outOfRange() = inputGroups.any { it.score.outOfRange() }

    override fun updateSuggestion() {
        inputGroups.forEach { it.suggestion.value = suggestionText }
    }

    override fun translate() = inputGroups.flatMap { (it.others + it.suggestion + it.score).map(InputTag::toPair) }

    init {
        suggestionText = inputGroups[0].suggestion.value
    }
}

data class Form(
    val basics: List<InputTag>,
    val overall: Overall,
    val teachers: List<Person>,
    val assistants: List<Person>
) {
    @StringRes
    fun invalid(): Int? {
        try {
            if (overall.score.outOfRange()) return 请为课程总体印象打分
            if (teachers.any(Person::outOfRange)) return 老师评分部分有遗漏
            if (assistants.isNotEmpty() && assistants.all(Person::outOfRange)) return 助教评分部分有遗漏
            return null
        } catch (e: Exception) {
            e.printStackTrace()
            return 发生异常
        }
    }

    fun serialize() = (basics.map(InputTag::toPair) + overall.toPairs() +
            teachers.flatMap(Person::toPairs) + assistants.flatMap(Person::toPairs)).toMap()
}