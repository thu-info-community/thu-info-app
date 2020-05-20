package com.unidy2002.thuinfo.data.network

import com.unidy2002.thuinfo.data.model.assessment.*
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import java.net.URLEncoder.encode

fun Network.getAssessmentList() = retryTemplate(2005) {
    connect(
        "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f/jxpg/f/jxpg/wj/xs/pgkcList",
        "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f/jxpg/f/xs/main",
        loggedInUser.vpnTicket
    ).getData().run {
        Jsoup.parse(this).getElementsByClass("table")[0].child(1).children().map {
            Triple(
                it.child(2).text().trim(),
                it.child(4).text().trim() == "是",
                it.child(5).child(0).attr("onclick").run {
                    "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f" +
                            substring(indexOf("Body('") + 6, indexOf("') })"))
                })
        }
    }
}

fun Network.getAssessmentForm(url: String) = retryTemplate(2005) {
    connect(
        url,
        "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f/jxpg/f/xs/main",
        loggedInUser.vpnTicket
    ).getData().run {
        val soup = Jsoup.parse(this).getElementById("xswjtxFormid")
        val basics = soup.select("#xswjtxFormid > input").map { InputTag(it) }
        val overallSuggestion = InputTag("kcpgjgDtos[0].jtjy", "")
        val overallScore = InputTag(soup.getElementById("kcpjfs"))
        val overall = Overall(overallSuggestion, overallScore)
        val tabPanes = soup.getElementsByClass("tab-pane")
        val teacherPane = tabPanes[0].getElementsByTag("table")
        val assistantPane = tabPanes[2].getElementsByTag("table")

        fun toPerson(table: Element): Person {
            lateinit var name: String
            val inputGroups = table.child(1).children().map {
                if (it.children().size == 4) name = it.child(0).text()
                val question = it.child(it.children().size / 2 - 1).text()
                val inputs = it.getElementsByTag("input")

                val suggestions = inputs.filter { input -> input.hasAttr("class") }
                assert(suggestions.size == 1)
                val suggestion = InputTag(suggestions[0])
                inputs.removeAll(suggestions)

                val scores = inputs.filter { input -> input.parent().tag().name == "ul" }
                assert(scores.size == 1)
                val score = InputTag(scores[0])
                inputs.removeAll(scores)

                val others = inputs.map { input -> InputTag(input) }
                InputGroup(question, suggestion, score, others)
            }
            return Person(name, inputGroups)
        }

        val teachers = teacherPane.map(::toPerson)
        val assistants = assistantPane.map(::toPerson)

        Form(basics, overall, teachers, assistants)
    }
}

fun Network.postAssessmentForm(data: Map<String, String>) = retryTemplate(2005) {
    connect(
        "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f/jxpg/b/jxpg/pgjg/xs/zancunjs",
        "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f/jxpg/f/xs/main",
        loggedInUser.vpnTicket,
        data.toList().joinToString("&") { "${encode(it.first, "UTF-8")}=${encode(it.second, "UTF-8")}" }
    ).getData().also { println(it) }
}
