package com.unidy2002.thuinfo.data.model.hole

data class HoleCommentCard(
    override val id: Int,
    override val timeStamp: Long,
    override val text: String,
    override val tag: String,
    val name: String
) : HoleCard