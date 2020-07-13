package com.unidy2002.thuinfo.data.network

import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONObject
import com.unidy2002.thuinfo.data.model.hole.HoleCard
import com.unidy2002.thuinfo.data.model.hole.HoleCommentCard
import com.unidy2002.thuinfo.data.model.hole.HoleTitleCard
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.ui.hole.HoleMainFragment.FetchMode
import java.net.URLEncoder.encode

private val token get() = loggedInUser.holeToken

private val foldTags = listOf("性相关", "政治相关", "性话题", "政治话题", "折叠", "NSFW", "刷屏", "真实性可疑", "用户举报较多", "举报较多", "重复内容")

private fun connect(url: String, post: String? = null): JSONObject =
    JSON.parseObject(Network.connect(url, post = post, hole = true).getData())

fun holeLogin() = try {
    connect("https://thuhole.com/api_xmcp/hole/system_msg?user_token=$token").run {
        get("error") == null && getJSONArray("result").isNotEmpty()
    }
} catch (e: Exception) {
    e.printStackTrace()
    false
}

fun getHoleList(mode: FetchMode, page: Int, payload: String): List<HoleTitleCard>? =
    if (mode == FetchMode.SEARCH && payload.matches(Regex("#\\d{1,7}"))) {
        if (page == 1) {
            try {
                listOf(
                    HoleTitleCard(
                        connect(
                            "https://thuhole.com/services/thuhole/api.php?action=getone&pid=${payload.drop(1)}&user_token=$token"
                        ).getJSONObject("data")
                    )
                )
            } catch (e: Exception) {
                e.printStackTrace()
                emptyList<HoleTitleCard>()
            }
        } else {
            emptyList()
        }
    } else {
        try {
            val data = connect(
                when (mode) {
                    FetchMode.NORMAL -> "https://thuhole.com/services/thuhole/api.php?action=getlist&p=$page&user_token=$token"
                    FetchMode.ATTENTION -> "https://thuhole.com/services/thuhole/api.php?action=getattention&user_token=$token"
                    FetchMode.SEARCH -> "https://thuhole.com/services/thuhole/api.php?action=search&pagesize=50&page=$page&keywords=$payload&user_token=$token"
                }
            ).getJSONArray("data")
            assert(data.isNotEmpty())
            val result = mutableListOf<HoleTitleCard>()
            for (i in data.indices)
                result.add(HoleTitleCard(data.getJSONObject(i)))
            result.filter { !loggedInUser.holeIgnore.hasIgnoreP(it.id) }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }?.also { result ->
        result.filter { it.tag in foldTags }.forEach {
            it.type = "text"
            it.text = "*单击以查看树洞*"
        }
    }

fun getHoleComments(pid: Int): Pair<Boolean, List<HoleCard>>? = try {
    val title = connect("https://thuhole.com/services/thuhole/api.php?action=getone&pid=$pid&user_token=$token")
        .getJSONObject("data")
    val result = mutableListOf<HoleCard>(HoleTitleCard(title))
    val commentsJson =
        connect("https://thuhole.com/services/thuhole/api.php?action=getcomment&pid=$pid&user_token=$token")
    val data = commentsJson.getJSONArray("data")
    for (i in data.indices) {
        result.add(data.getJSONObject(i).run {
            HoleCommentCard(
                getInteger("cid"),
                getLong("timestamp"),
                getString("text"),
                getString("tag") ?: "",
                getString("name")
            )
        })
    }
    (commentsJson.getInteger("attention") == 1) to result
} catch (e: Exception) {
    e.printStackTrace()
    null
}

fun postNewHole(text: String, withImg: Boolean = false) = try {
    val result = connect(
        "https://thuhole.com/services/thuhole/api.php?action=dopost&user_token=$token",
        post = "text=${encode(text, "UTF-8")}&type=${if (withImg) "image" else "text"}&user_token=$token${
        if (withImg) "&data=${encode(loggedInUser.currentImageBase64, "UTF-8")}" else ""}"
    )
    result.getInteger("code") == 0
} catch (e: Exception) {
    e.printStackTrace()
    false
}

fun postHoleComment(pid: Int, text: String) = try {
    val result = connect(
        "https://thuhole.com/services/thuhole/api.php?action=docomment&user_token=$token",
        post = "pid=$pid&text=${encode(text, "UTF-8")}&user_token=$token"
    )
    result.getInteger("code") == 0
} catch (e: Exception) {
    e.printStackTrace()
    false
}

fun setHoleAttention(pid: Int, attention: Boolean) = try {
    connect(
        "https://thuhole.com/services/thuhole/api.php?action=attention&user_token=$token",
        post = "pid=$pid&switch=${if (attention) 1 else 0}&user_token=$token"
    )
    connect("https://thuhole.com/services/thuhole/api.php?action=getcomment&pid=$pid&user_token=$token").getInteger("attention") == 1
} catch (e: Exception) {
    e.printStackTrace()
    null
}

fun postHoleReport(pid: Int, reason: String) = try {
    connect(
        "https://thuhole.com/services/thuhole/api.php?action=report&user_token=$token",
        post = "user_token=$token&pid=$pid&reason=$reason"
    ).getInteger("code") == 0
} catch (e: Exception) {
    e.printStackTrace()
    false
}