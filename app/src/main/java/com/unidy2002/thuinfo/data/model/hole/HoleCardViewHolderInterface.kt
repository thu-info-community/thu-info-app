package com.unidy2002.thuinfo.data.model.hole

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.text.util.Linkify
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
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
import io.noties.markwon.AbstractMarkwonPlugin
import io.noties.markwon.Markwon
import io.noties.markwon.MarkwonConfiguration
import io.noties.markwon.ext.latex.JLatexMathPlugin
import io.noties.markwon.ext.strikethrough.StrikethroughPlugin
import io.noties.markwon.ext.tables.TablePlugin
import io.noties.markwon.inlineparser.MarkwonInlineParserPlugin
import io.noties.markwon.linkify.LinkifyPlugin

/*@PrismBundle(
    include = ["java", "c"],
    grammarLocatorClassName = ".MyGrammarLocator"
)*/
interface HoleCardViewHolderInterface {
    val id: TextView
    val tag: TextView
    val time: TextView
    val text: TextView
    val image: ImageView
}

/*val highlight: SyntaxHighlight =
    Prism4jSyntaxHighlight.create(Prism4j(MyGrammarLocator()), Prism4jThemeDefault.create())*/

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

    if (card is HoleTitleCard && this is HoleMainFragment.HoleAdapter.HoleCardViewHolder) {
        bindCnt(card.reply, commentIcon, commentCnt)
        bindCnt(card.like, starIcon, starCnt)
    }

    if (context == null) {
        text.text = card.text
    } else {
        try {
            Markwon.builder(context)
                .usePlugin(MarkwonInlineParserPlugin.create())
                .usePlugin(JLatexMathPlugin.create(text.textSize) { it.inlinesEnabled(true) })
                .usePlugin(LinkifyPlugin.create(Linkify.WEB_URLS))
                .usePlugin(StrikethroughPlugin.create())
                .usePlugin(TablePlugin.create(context))
                .usePlugin(object : AbstractMarkwonPlugin() {
                    override fun configureConfiguration(builder: MarkwonConfiguration.Builder) {
                        builder.linkResolver { view, link ->
                            (fragment as? HoleMainFragment)?.navigateDestination = positionGetter(card.id)
                            try {
                                if (link.startsWith("hole://#")) {
                                    NavHostFragment.findNavController(fragment).navigate(
                                        R.id.holeCommentsFragment,
                                        Bundle().apply { putInt("pid", link.drop(8).toInt()) }
                                    )
                                    intercept = true
                                } else {
                                    view.context.startActivity(
                                        Intent(Intent.ACTION_VIEW, Uri.parse(link))
                                    )
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    }
                })
                .build()
                .setMarkdown(text, card.text
                    .replace(Regex("(https?://)?thuhole\\.com/?#(?:#|%23)\\d{1,7}")) {
                        it.value.substringAfter('#')
                    }
                    .replace(Regex("#\\d{1,7}")) { "[${it.value}](hole://${it.value})" }
                    .run {
                        if (card is HoleCommentCard &&
                            substringBefore('\n').matches(Regex("\\[[洞主A-Za-z0-9 ]+] (#|\\$\\$|```).+"))
                        ) replaceFirst("] ", "]\n") else this
                    }
                    .replace("\n", "  \n")
                    .replace("$", "$$"))
            /*.toSpannable().apply {
                Regex("(?:(?:Angry|Baby|Crazy|Diligent|Excited|Fat|Greedy|Hungry|Interesting|Jolly|Kind|Little|Magic|Naïve|Old|PKU|Quiet|Rich|Superman|Tough|Undefined|Valuable|Wifeless|Xiangbuchulai|Young|Zombie)\\s)?(?:Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hans|Isabella|Jason|Kate|Louis|Margaret|Nathan|Olivia|Paul|Queen|Richard|Susan|Thomas|Uma|Vivian|Winnie|Xander|Yasmine|Zach)|You Win(?: \\d+)?|洞主")
                    .findAll(toString()).forEach {
                        if (!(startsWith('[') && it.range.first == 1))
                            setSpan(
                                ForegroundColorSpan(getColor(context, R.color.colorPrimaryLight)),
                                it.range.first, it.range.last + 1,
                                SPAN_EXCLUSIVE_EXCLUSIVE
                            )
                    }
            }*/

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
        } catch (e: Exception) {
            e.printStackTrace()
            text.text = card.text
        }
    }
}

private fun bindCnt(cnt: Int, icon: ImageView, text: TextView) {
    if (cnt > 0) {
        icon.visibility = View.VISIBLE
        text.visibility = View.VISIBLE
        text.text = cnt.toString()
    } else {
        icon.visibility = View.GONE
        text.visibility = View.GONE
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