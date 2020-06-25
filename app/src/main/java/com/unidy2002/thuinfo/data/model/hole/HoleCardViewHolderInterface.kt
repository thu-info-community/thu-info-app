package com.unidy2002.thuinfo.data.model.hole

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.text.SpannableString
import android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
import android.text.TextPaint
import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.text.style.URLSpan
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat.getColor
import androidx.core.content.getSystemService
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.util.dateToRelativeTime
import com.unidy2002.thuinfo.data.util.getBitmap
import com.unidy2002.thuinfo.data.util.safeThread
import com.unidy2002.thuinfo.data.util.save
import com.unidy2002.thuinfo.ui.hole.HoleMainFragment

interface HoleCardViewHolderInterface {
    val id: TextView
    val tag: TextView
    val time: TextView
    val text: TextView
    val image: ImageView
}

@SuppressLint("SetTextI18n")
fun HoleCardViewHolderInterface.bind(
    context: Context?,
    fragment: Fragment,
    card: HoleCard,
    positionGetter: (Int) -> Int
) {
    var intercept = false
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
        (this as? RecyclerView.ViewHolder)?.run {
            text.setOnClickListener {
                if (!intercept) itemView.callOnClick()
                intercept = false
            }
            text.setOnLongClickListener {
                if (!intercept) itemView.performLongClick()
                intercept = false
                true
            }
        }
        text.movementMethod = LinkMovementMethod.getInstance()

        text.text = SpannableString(card.text).apply {
            val covered = mutableSetOf<Int>()

            fun Regex.span(span: (String) -> Any, additionalCondition: (IntRange) -> Boolean = { true }) {
                findAll(card.text).filter { covered.intersect(it.range).isEmpty() && additionalCondition(it.range) }
                    .forEach {
                        covered.addAll(it.range)
                        setSpan(span(it.value), it.range.first, it.range.last + 1, SPAN_EXCLUSIVE_EXCLUSIVE)
                    }
            }

            Regex("((https?://)?(?:(?:[\\w-]+\\.)+[a-zA-Z]{2,3}|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(?::\\d{1,5})?(?:/[\\w~!@#$%^&*()\\-_=+[\\\\]{};:,./?|]*)?)(?![a-zA-Z0-9])")
                .span({ url ->
                    object : URLSpan(url) {
                        override fun onClick(widget: View) {
                            super.onClick(widget)
                            (fragment as? HoleMainFragment)?.navigateDestination = positionGetter(card.id)
                        }
                    }
                })

            Regex("#\\d{1,7}").span({ index ->
                object : ClickableSpan() {
                    override fun updateDrawState(ds: TextPaint) {
                        ds.color = ds.linkColor
                    }

                    override fun onClick(widget: View) {
                        try {
                            NavHostFragment.findNavController(fragment).navigate(
                                R.id.holeCommentsFragment,
                                Bundle().apply { putInt("pid", index.drop(1).toInt()) }
                            )
                            (fragment as? HoleMainFragment)?.navigateDestination = positionGetter(card.id)
                            intercept = true
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }

                }
            })

            Regex("(?:(?:Angry|Baby|Crazy|Diligent|Excited|Fat|Greedy|Hungry|Interesting|Jolly|Kind|Little|Magic|Naïve|Old|PKU|Quiet|Rich|Superman|Tough|Undefined|Valuable|Wifeless|Xiangbuchulai|Young|Zombie)\\s)?(?:Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hans|Isabella|Jason|Kate|Louis|Margaret|Nathan|Olivia|Paul|Queen|Richard|Susan|Thomas|Uma|Vivian|Winnie|Xander|Yasmine|Zach)|You Win(?: \\d+)?|洞主")
                .span({ ForegroundColorSpan(getColor(context, R.color.colorPrimaryLight)) }) {
                    !(card is HoleCommentCard && it.first == 1)
                }
        }
    }
}

fun copyUtil(context: Context, data: String) {
    val manager = context.getSystemService<ClipboardManager>()
    if (manager == null) {
        Toast.makeText(context, R.string.hole_copy_failure_str, Toast.LENGTH_SHORT).show()
    } else {
        manager.setPrimaryClip(ClipData.newPlainText("THUInfo", data))
        Toast.makeText(context, R.string.hole_copy_success_str, Toast.LENGTH_SHORT).show()
    }
}

fun saveImgUtil(context: Context, handler: Handler, item: HoleTitleCard) {
    safeThread {
        try {
            Network.getBitmap("https://thuhole.com//images/${item.url}").save(context, "#${item.id}")
            handler.post { Toast.makeText(context, R.string.hole_save_success_str, Toast.LENGTH_SHORT).show() }
        } catch (e: Exception) {
            e.printStackTrace()
            handler.post { Toast.makeText(context, R.string.hole_save_failure_str, Toast.LENGTH_SHORT).show() }
        }
    }
}