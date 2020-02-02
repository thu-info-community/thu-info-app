package com.unidy2002.thuinfo.data.model.news

import android.content.Context
import android.util.Log
import com.unidy2002.thuinfo.data.dao.NewsDBManager
import com.unidy2002.thuinfo.ui.login.LoginActivity
import org.jsoup.Jsoup
import java.lang.Exception
import java.text.SimpleDateFormat
import java.util.*

class NewsContainer(val context: Context) {
    val newsList: MutableList<NewsItem> = mutableListOf()

    val newsDBManager = NewsDBManager.getInstance(context)

    var state = -1

    enum class NewsOriginType {
        POST_INFO_L, POST_INFO_T
    }

    data class NewsOrigin(
        val url: String,
        val name: String,
        val type: NewsOriginType,
        val originId: Int,
        var currentPage: Int = -1,
        val currentBuffer: MutableList<NewsItem> = mutableListOf(),
        var currentIndex: Int = 0
    )

    private val prefix =
        "http://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e0f852882e3e6e5f301c9aa596522b2043f84ba24ebecaf8/f/"
    private val suffix = "/more?page="

    private fun getData(newsOrigin: NewsOrigin) {
        newsOrigin.currentBuffer.clear()
        if (newsOrigin.type != NewsOriginType.POST_INFO_T) {
            try {
                Jsoup.connect("$prefix${newsOrigin.url}$suffix${newsOrigin.currentPage}").cookie(
                    "wengine_vpn_ticket",
                    LoginActivity.loginViewModel.getLoggedInUser().vpnTicket
                        .run { substring(this.indexOf('=') + 1) }
                ).get().select("li").filter {
                    it.children().isNotEmpty() && it.child(0).tagName() == "em"
                }.forEach {
                    val title = it.child(1).text()
                    val href = it.child(1).attr("abs:href")
                    val brief = newsDBManager.get(title, href)
                    newsOrigin.currentBuffer.add(
                        NewsItem(
                            newsOrigin.originId,
                            SimpleDateFormat("yyyy.MM.dd", Locale.CHINA).parse(it.child(2).text())!!,
                            it.ownText().drop(1).dropLast(1),
                            title,
                            brief ?: "加载中……",
                            href,
                            brief != null
                        )
                    )
                }
            } catch (e: Exception) {
                Log.e("CONNECTION", "Error when connecting $prefix${newsOrigin.url}$suffix${newsOrigin.currentPage}.")
                e.printStackTrace()
            }
        }
    }

    private fun getNewBuffer(newsOrigin: NewsOrigin): NewsItem? =
        if (newsOrigin.currentBuffer.isEmpty() && newsOrigin.currentPage != -1)
            null
        else {
            newsOrigin.currentPage++
            newsOrigin.currentIndex = 0
            getData(newsOrigin)
            if (newsOrigin.currentBuffer.isEmpty())
                null
            else
                newsOrigin.currentBuffer[0]
        }

    private fun getCurrentCard(newsOrigin: NewsOrigin): NewsItem? =
        if (newsOrigin.currentIndex < newsOrigin.currentBuffer.size)
            newsOrigin.currentBuffer[newsOrigin.currentIndex]
        else
            getNewBuffer(newsOrigin)

    fun getNews(maximum: Int, clear: Boolean) {
        if (clear) {
            newsList.clear()
            newsOriginList.forEach {
                apply {
                    it.currentPage = -1
                    it.currentBuffer.clear()
                    it.currentIndex = 0
                }
            }
        }
        repeat(maximum) {
            (if (state == -1)
                newsOriginList.mapNotNull { getCurrentCard(it) }.maxBy { it.getComparableDate() }
            else
                getCurrentCard(newsOriginList[state]))
                ?.run {
                    newsList.add(this)
                    newsOriginList[this.originId].currentIndex++
                }
        }
    }

    fun changeState(param: Int) {
        state = if (state == param) -1 else param
    }

    val newsOriginList: List<NewsOrigin> = listOf(
        NewsOrigin(
            "jiaowugonggao",
            "教务公告",
            NewsOriginType.POST_INFO_L,
            0
        ),
        NewsOrigin(
            "keyantongzhi",
            "科研通知",
            NewsOriginType.POST_INFO_L,
            1
        ),
        NewsOrigin(
            "haibao",
            "海报",
            NewsOriginType.POST_INFO_L,
            2
        ),
        NewsOrigin(
            "bangongtongzhi",
            "办公通知",
            NewsOriginType.POST_INFO_L,
            3
        ),
        NewsOrigin(
            "zhaobiaoxinxi",
            "招标招租",
            NewsOriginType.POST_INFO_L,
            4
        )
    )
}