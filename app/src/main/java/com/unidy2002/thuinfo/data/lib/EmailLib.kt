package com.unidy2002.thuinfo.data.lib

import com.sun.mail.imap.IMAPFolder
import com.sun.mail.imap.IMAPStore
import com.unidy2002.thuinfo.data.model.EmailModel
import java.util.*
import javax.mail.Folder
import javax.mail.Session

fun connectImap(username: String, password: String) =
    (Session.getInstance(Properties().apply {
        put("mail.store.protocol", "imap")
        put("mail.imap.host", "mails.tsinghua.edu.cn")
    }).getStore("imap") as IMAPStore).apply {
        connect(username, password)
    }

fun getEmailList(imapStore: IMAPStore, folder: String) =
    imapStore.run {
        getFolder(folder) as IMAPFolder
    }.run {
        open(Folder.READ_WRITE)
        messages.mapNotNull {
            try {
                EmailModel(it)
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }.asReversed()
    }