package com.unidy2002.thuinfo.data.network

import com.alibaba.fastjson.JSON
import com.unidy2002.thuinfo.data.model.hole.HoleCard
import com.unidy2002.thuinfo.data.model.hole.HoleCommentCard
import com.unidy2002.thuinfo.data.model.hole.HoleTitleCard
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import java.net.URLEncoder.encode

val token get() = loggedInUser.holeToken

fun Network.holeLogin() = try {
    JSON.parseObject(
        connect("https://thuhole.com/api_xmcp/hole/system_msg?user_token=$token").getData()
    ).run {
        get("error") == null && getJSONArray("result").isNotEmpty()
    }
} catch (e: Exception) {
    e.printStackTrace()
    false
}

/**
 * page >= 0:  NORMAL
 * page == -1: ATTENTION
 * page == -2: SEARCH
 */
fun Network.getHoleList(page: Int, payload: String): List<HoleTitleCard>? = try {
    val data = JSON.parseObject(
        connect(
            when (page) {
                -1 -> "https://thuhole.com/services/thuhole/api.php?action=getattention&user_token=$token"
                -2 -> "https://thuhole.com/services/thuhole/api.php?action=search&pagesize=50&page=1&keywords=$payload&user_token=$token"
                else -> "https://thuhole.com/services/thuhole/api.php?action=getlist&p=$page&user_token=$token"
            }
        ).getData()
    ).getJSONArray("data")
    assert(data.isNotEmpty())
    val result = mutableListOf<HoleTitleCard>()
    for (i in data.indices) {
        result.add(HoleTitleCard(data.getJSONObject(i)))
    }
    result
} catch (e: Exception) {
    e.printStackTrace()
    null
}

fun Network.getHoleComments(pid: Int): List<HoleCard>? = try {
    val title = JSON.parseObject(
        connect("https://thuhole.com/services/thuhole/api.php?action=getone&pid=$pid").getData()
    ).getJSONObject("data")
    val result = mutableListOf<HoleCard>(HoleTitleCard(title))
    val data = JSON.parseObject(
        connect("https://thuhole.com/services/thuhole/api.php?action=getcomment&pid=$pid&user_token=$token").getData()
    ).getJSONArray("data")
    for (i in data.indices) {
        result.add(data.getJSONObject(i).run {
            HoleCommentCard(getInteger("cid"), getLong("timestamp"), getString("text"), getString("name"))
        })
    }
    result
} catch (e: Exception) {
    e.printStackTrace()
    null
}

fun Network.postNewHole(text: String, withImg: Boolean = false) = try {
    val result = JSON.parseObject(
        connect(
            "https://thuhole.com/services/thuhole/api.php?action=dopost&user_token=$token",
            post = "text=${encode(text, "UTF-8")}&type=${if (withImg) "image" else "text"}&user_token=$token${
            if (withImg) "&data=${encode(loggedInUser.currentImageBase64, "UTF-8")}" else ""}"
        ).getData()
    )
    result.getInteger("code") == 0
} catch (e: Exception) {
    e.printStackTrace()
    false
}

fun Network.postHoleComment(pid: Int, text: String) = try {
    val result = JSON.parseObject(
        connect(
            "https://thuhole.com/services/thuhole/api.php?action=docomment&user_token=$token",
            post = "pid=$pid&text=${encode(text, "UTF-8")}&user_token=$token"
        ).getData()
    )
    result.getInteger("code") == 0
} catch (e: Exception) {
    e.printStackTrace()
    false
}