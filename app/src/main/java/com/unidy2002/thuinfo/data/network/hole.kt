package com.unidy2002.thuinfo.data.network

import com.alibaba.fastjson.JSON
import com.unidy2002.thuinfo.data.model.hole.HoleTitleCard
import com.unidy2002.thuinfo.data.model.login.loggedInUser

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

fun Network.getHoleList(page: Int): List<HoleTitleCard>? = try {
    val data = JSON.parseObject(
        connect("https://thuhole.com/services/thuhole/api.php?action=getlist&p=$page&user_token=$token").getData()
    ).getJSONArray("data")
    assert(data.isNotEmpty())
    val result = mutableListOf<HoleTitleCard>()
    for (i in data.indices) {
        result.add(data.getJSONObject(i).run {
            HoleTitleCard(getInteger("pid"), getLong("timestamp"), getString("text"), getInteger("likenum"))
        })
    }
    result
} catch (e: Exception) {
    e.printStackTrace()
    null
}