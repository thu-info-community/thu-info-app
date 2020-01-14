package com.unidy2002.thuinfo.data.model

import android.util.Log
import org.jsoup.Jsoup
import java.lang.Exception
import java.text.SimpleDateFormat
import java.util.*

class NewsContainer {
    val newsCardList: MutableList<NewsCard> = mutableListOf()

    enum class NewsOriginType {
        POST_INFO_L, POST_INFO_T
    }

    data class NewsOrigin(
        val url: String,
        val name: String,
        val type: NewsOriginType,
        val originId: Int,
        var currentPage: Int = -1,
        val currentBuffer: MutableList<NewsCard> = mutableListOf(),
        var currentIndex: Int = 0
    ) {
        private val prefix = "http://postinfo.tsinghua.edu.cn/f/"
        private val suffix = "/more?page="

        private fun getData() {
            currentBuffer.clear()
            if (type != NewsOriginType.POST_INFO_T) {
                try {
                    Jsoup.connect("$prefix$url$suffix$currentPage").get().select("li").filter {
                        it.children().isNotEmpty() && it.child(0).tagName() == "em"
                    }.forEach {
                        currentBuffer.add(
                            NewsCard(
                                originId,
                                SimpleDateFormat("yyyy.MM.dd", Locale.CHINA).parse(it.child(2).text())!!,
                                it.ownText().drop(1).dropLast(1),
                                it.child(1).text(),
                                "加载中……",
                                it.child(1).attr("abs:href")
                            )
                        )
                    }
                } catch (e: Exception) {
                    Log.e("CONNECTION", "Error when connecting $prefix$url$suffix$currentPage.")
                    e.printStackTrace()
                }
            }
        }

        private fun getNewBuffer(): NewsCard? =
            if (currentBuffer.isEmpty() && currentPage != -1)
                null
            else {
                currentPage++
                currentIndex = 0
                getData()
                if (currentBuffer.isEmpty())
                    null
                else
                    currentBuffer[0]
            }

        fun getCurrentCard(): NewsCard? =
            if (currentIndex < currentBuffer.size)
                currentBuffer[currentIndex]
            else
                getNewBuffer()
    }

    fun getNews(maximum: Int, clear: Boolean) {
        if (clear) {
            newsCardList.clear()
            newsOriginList.forEach {
                apply {
                    it.currentPage = -1
                    it.currentBuffer.clear()
                    it.currentIndex = 0
                }
            }
        }
        repeat(maximum) {
            newsOriginList.mapNotNull { it.getCurrentCard() }.maxBy { it.getComparableDate() }?.run {
                newsCardList.add(this)
                newsOriginList[this.originId].currentIndex++
            }
        }
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