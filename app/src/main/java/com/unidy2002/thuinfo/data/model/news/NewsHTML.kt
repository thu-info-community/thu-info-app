package com.unidy2002.thuinfo.data.model.news

import org.jsoup.nodes.Element

data class NewsHTML(val title: String, val body: List<Element>) {
    override fun toString(): String =
        "<h1>$title</h1>${body.joinToString("")}"

    val brief: String
        get() = body.joinToString("") { it.text() }.replace(Regex("[\\s]"), "")
}