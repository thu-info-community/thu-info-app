package com.unidy2002.thuinfo.data.model.assessment

import org.jsoup.nodes.Element

data class InputTag(val name: String, var value: String) {
    constructor(input: Element) : this(input.attr("name"), input.attr("value"))

    fun toPair() = Pair(name, value)
}

data class InputGroup(val question: String, val suggestion: InputTag, val score: InputTag, val others: List<InputTag>)

data class Overall(val suggestion: InputTag, val score: InputTag, var suggestionText: String = "") {
    private fun updateSuggestion() {
        suggestion.value = suggestionText
    }

    fun toPairs(): List<Pair<String, String>> {
        updateSuggestion()
        return listOf(suggestion.toPair(), score.toPair())
    }
}

data class Person(val name: String, val inputGroups: List<InputGroup>, var suggestionText: String = "") {
    fun autoScore(score: Int = 7) {
        inputGroups.forEach { it.score.value = score.toString() }
    }

    private fun updateSuggestion() {
        inputGroups.forEach { it.suggestion.value = suggestionText }
    }

    fun toPairs(): List<Pair<String, String>> {
        updateSuggestion()
        return inputGroups.flatMap { (it.others + it.suggestion + it.score).map(InputTag::toPair) }
    }
}

data class Form(
    val basics: List<InputTag>,
    val overall: Overall,
    val teachers: List<Person>,
    val assistants: List<Person>
) {
    fun serialize() = (basics.map(InputTag::toPair) + overall.toPairs() +
            teachers.flatMap(Person::toPairs) + assistants.flatMap(Person::toPairs)).toMap()
}