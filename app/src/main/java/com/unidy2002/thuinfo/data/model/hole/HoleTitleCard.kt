package com.unidy2002.thuinfo.data.model.hole

import com.alibaba.fastjson.JSONObject

data class HoleTitleCard(
    override val id: Int,
    override val timeStamp: Long,
    override val text: String,
    override val tag: String,
    var like: Int,
    val type: String,
    val url: String,
    val reply: Int
) : HoleCard {
    constructor(json: JSONObject) : this(
        json.getInteger("pid"),
        json.getLong("timestamp"),
        json.getString("text"),
        json.getString("tag") ?: "",
        json.getInteger("likenum"),
        json.getString("type"),
        json.getString("url"),
        json.getInteger("reply")
    )
}