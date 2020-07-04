package com.unidy2002.thuinfo.data.network

import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.model.news.NewsHTML
import org.jsoup.Jsoup
import java.net.URL

fun getWentuState(): List<Pair<String, Pair<Int, Int>>> =
    try {
        Jsoup.parse(URL("http://ske.lib.tsinghua.edu.cn/roomshow/"), 6000).body().child(0)
            .child(2).child(0).child(0).children().drop(3).map {
                it.child(0).text() to
                        (it.child(1).text().toInt() to it.child(2).text().toInt())
            }
    } catch (e: Exception) {
        e.printStackTrace()
        listOf()
    }

fun getPrettyPrintHTML(url: String): NewsHTML? =
    try {
        Jsoup.connect(url).cookies(
            loggedInUser.vpnTicket.split("; ").mapNotNull {
                with(it.split('=')) { if (size == 2) this[0] to this[1] else null }
            }.toMap()
        ).get().run {
            when {
                url.contains("jwcbg") ->
                    body().child(1).child(0).child(0).child(0).child(0).run {
                        NewsHTML(
                            child(2).child(0).child(0).text(),
                            child(4).child(0).child(0).child(0).child(1)
                                .child(0).child(1).child(0).child(1).child(0)
                                .child(0).child(0).children()
                        )
                    }
                url.contains("kybg") ->
                    body().child(2).child(0).child(0).child(1).child(3).child(0).run {
                        NewsHTML(
                            child(0).text(),
                            child(1).child(0).children()
                        )
                    }
                url.contains("gjc") ->
                    body().child(1).child(0).child(0).child(0).child(1).child(0)
                        .child(4).child(0).child(0).child(0).child(0).child(0).run {
                            NewsHTML(
                                child(1).text(),
                                children().drop(2).dropLast(1)
                            )
                        }
                url.contains("77726476706e69737468656265737421e8ef439b69336153301c9aa596522b20e1a870705b76e399") ->
                    NewsHTML(
                        "",
                        select("td.td4").first().children()
                    )
                url.contains("77726476706e69737468656265737421e9fd528569336153301c9aa596522b20735d12f268e561f0") ->
                    getElementById("center").run {
                        NewsHTML(
                            child(1).text(),
                            child(3).child(0).children()
                        )
                    }
                url.contains("77726476706e69737468656265737421e0f852882e3e6e5f301c9aa596522b2043f84ba24ebecaf8") ->
                    select("div.cont_doc_box").first().run {
                        NewsHTML(
                            child(0).child(0).text(),
                            child(1).children()
                        )
                    }
                url.contains("77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3") ->
                    body().child(1).child(0).child(0).child(0).child(0).child(0)
                        .child(0).child(0).child(0).run {
                            NewsHTML(
                                child(2).child(0).child(0).child(0).text(),
                                child(3).child(0).child(0).child(0).children()
                            )
                        }
                url.contains("77726476706e69737468656265737421f8e60f8834396657761d88e29d51367b523e") ->
                    select("section.r_cont").first().run {
                        NewsHTML(
                            child(2).text(),
                            child(4).children()
                        )
                    }
                url.contains("fgc") ->
                    getElementById("content2").child(0).run {
                        NewsHTML(
                            child(2).text(),
                            child(3).child(0).child(0).children().drop(1)
                        )
                    }
                url.contains("rscbg") ->
                    body().child(1).child(0).child(0).child(1).child(0).child(0)
                        .child(2).child(0).child(0).child(0).child(0).child(0).run {
                            NewsHTML(
                                child(0).text(),
                                child(1).child(0).child(2).child(0).children()
                            )
                        }
                url.contains("77726476706e69737468656265737421e7e056d234297b437c0bc7b88b5c2d3212b31e4d37621d4714d6") ->
                    NewsHTML(
                        "",
                        select("div.main").first().child(0).children()
                    )
                url.contains("ghxt") ->
                    body().child(2).child(0).child(1).child(0).child(0).child(0).run {
                        NewsHTML(
                            child(1).text(),
                            child(4).child(0).child(0).child(0).children()
                        )
                    }
                url.contains("eleres") ->
                    select("table.bulletTable").first().child(0).run {
                        NewsHTML(
                            child(0).child(1).text(),
                            child(1).child(1).child(0).child(0).child(0).child(0).children()
                        )
                    }
                url.contains("77726476706e69737468656265737421e8e442d23323615e79009cadd6502720f9b87b") ->
                    select("div.xm-con").first().run {
                        NewsHTML(
                            child(1).text(),
                            child(3).children()
                        )
                    }
                url.contains("jdbsc") ->
                    body().child(2).child(0).child(0).child(2).child(0).child(0)
                        .child(0).child(0).child(0).run {
                            NewsHTML(
                                child(0).child(0).child(1).text(),
                                child(1).child(0).child(0).child(0).children()
                            )
                        }
                url.contains("77726476706e69737468656265737421e3f5468534367f1e6d119aafd641303ceb8f9190006d6afc78336870") ->
                    throw Exception("招标招租")
                else ->
                    NewsHTML("", listOf(body().also { if (text().trim().isEmpty()) throw Exception() }))
            }
        }
    } catch (e: Exception) {
        if (e.message != "招标招租")
            e.printStackTrace()
        null
    }
