package com.unidy2002.thuinfo.data.model.hole

import android.annotation.SuppressLint
import android.content.Context
import android.text.SpannableString
import android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
import android.text.style.ForegroundColorSpan
import android.text.style.URLSpan
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat.getColor
import com.bumptech.glide.Glide
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.util.dateToRelativeTime

interface HoleCardViewHolderInterface {
    val id: TextView
    val tag: TextView
    val time: TextView
    val text: TextView
    val image: ImageView
}

@SuppressLint("SetTextI18n")
fun HoleCardViewHolderInterface.bind(context: Context?, card: HoleCard) {
    id.text = "#${card.id}"
    tag.visibility = if (card.tag.isBlank()) View.GONE else View.VISIBLE
    tag.text = card.tag
    time.text = dateToRelativeTime(card.timeStamp)
    if (card is HoleTitleCard && card.type == "image") {
        context?.run {
            image.visibility = View.VISIBLE
            image.setImageResource(R.drawable.hole_loading_image)
            Glide.with(this)
                .load("https://thuhole.com//images/${card.url}")
                .into(image)
        }
    } else {
        image.visibility = View.GONE
    }

    if (context == null) {
        text.text = card.text
    } else {
        text.text = SpannableString(card.text).apply {
            val covered = mutableSetOf<Int>()

            fun Regex.span(span: (String) -> Any, additionalCondition: (IntRange) -> Boolean = { true }) {
                findAll(card.text).filter { covered.intersect(it.range).isEmpty() && additionalCondition(it.range) }
                    .forEach {
                        covered.addAll(it.range)
                        println(it.range)
                        println(it.value)
                        setSpan(span(it.value), it.range.first, it.range.last + 1, SPAN_EXCLUSIVE_EXCLUSIVE)
                    }
            }

            Regex("((https?://)?(?:(?:[\\w-]+\\.)+[a-zA-Z]{2,3}|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(?::\\d{1,5})?(?:/[\\w~!@#$%^&*()\\-_=+[\\\\]{};:,./?|]*)?)(?![a-zA-Z0-9])")
                .span({ url -> URLSpan(url) })
            Regex("#\\d{1,7}").span({ ForegroundColorSpan(getColor(context, R.color.colorAccent)) })
            Regex("(?:(?:Angry|Baby|Crazy|Diligent|Excited|Fat|Greedy|Hungry|Interesting|Jolly|Kind|Little|Magic|Naïve|Old|PKU|Quiet|Rich|Superman|Tough|Undefined|Valuable|Wifeless|Xiangbuchulai|Young|Zombie)\\s)?(?:Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hans|Isabella|Jason|Kate|Louis|Margaret|Nathan|Olivia|Paul|Queen|Richard|Susan|Thomas|Uma|Vivian|Winnie|Xander|Yasmine|Zach)|You Win(?: \\d+)?|洞主")
                .span({ ForegroundColorSpan(getColor(context, R.color.colorPrimaryLight)) }) {
                    !(card is HoleCommentCard && it.first == 1)
                }
        }
    }
}