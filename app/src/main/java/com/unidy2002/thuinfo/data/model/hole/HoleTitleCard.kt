package com.unidy2002.thuinfo.data.model.hole

data class HoleTitleCard(
    override val id: Int,
    override val timeStamp: Long,
    override val text: String,
    var like: Int
) : HoleCard