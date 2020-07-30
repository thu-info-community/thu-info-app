package com.unidy2002.thuinfo.data.util

import android.view.KeyEvent
import android.widget.EditText
import com.sj.emoji.DefEmoticons
import com.sj.emoji.EmojiBean
import com.sj.emoji.EmojiParse
import com.unidy2002.thuinfo.R
import sj.keyboard.EmoticonsKeyBoardPopWindow
import sj.keyboard.adpater.EmoticonsAdapter
import sj.keyboard.adpater.PageSetAdapter
import sj.keyboard.data.EmoticonPageEntity
import sj.keyboard.data.EmoticonPageSetEntity
import sj.keyboard.utils.imageloader.ImageBase
import sj.keyboard.widget.EmoticonPageView
import java.util.*

fun generateKeyboard(editText: EditText) = EmoticonsKeyBoardPopWindow(editText.context).apply {
    setAdapter(PageSetAdapter().apply {
        val emoticonList = DefEmoticons.getDefEmojiArray().toCollection(ArrayList())
        emoticonList[7] = EmojiBean(R.mipmap.emoji_0x1f3c6, EmojiParse.fromCodePoint(0x1f3c6))
        emoticonList[8] = EmojiBean(R.mipmap.emoji_0x1f351, EmojiParse.fromCodePoint(0x1f351))
        emoticonList[11] = EmojiBean(R.mipmap.emoji_0x1f474, EmojiParse.fromCodePoint(0x1f474))
        emoticonList[12] = EmojiBean(R.mipmap.emoji_0x1f475, EmojiParse.fromCodePoint(0x1f475))
        add(EmoticonPageSetEntity.Builder<Any>()
            .setLine(3)
            .setRow(7)
            .setEmoticonList(emoticonList)
            .setIPageViewInstantiateItem { container, _, pageEntity ->
                pageEntity as EmoticonPageEntity<*>
                if (pageEntity.rootView == null) {
                    pageEntity.rootView = EmoticonPageView(container.context).apply {
                        setNumColumns(pageEntity.row)
                        emoticonsGridView.adapter =
                            EmoticonsAdapter<Any>(container.context, pageEntity, null).apply {
                                setOnDisPlayListener { _, _, viewHolder, o, _ ->
                                    viewHolder.run {
                                        ly_root.setBackgroundResource(com.keyboard.view.R.drawable.bg_emoticon)
                                        iv_emoticon.setImageResource(if (o is EmojiBean) o.icon else R.mipmap.icon_del)
                                        rootView.setOnClickListener {
                                            if (o is EmojiBean) {
                                                editText.text.insert(editText.selectionStart, o.emoji)
                                            } else {
                                                editText.onKeyDown(
                                                    KeyEvent.KEYCODE_DEL,
                                                    KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DEL)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                    }
                }
                pageEntity.rootView
            }
            .setShowDelBtn(EmoticonPageEntity.DelBtnStatus.LAST)
            .setIconUri(ImageBase.Scheme.DRAWABLE.toUri("icon_emoji"))
            .build())
    })
}