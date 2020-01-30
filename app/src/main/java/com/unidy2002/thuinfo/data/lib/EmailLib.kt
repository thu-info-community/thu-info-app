package com.unidy2002.thuinfo.data.lib

import com.sun.mail.imap.IMAPFolder
import com.sun.mail.imap.IMAPStore
import com.unidy2002.thuinfo.data.model.email.EmailModel
import com.unidy2002.thuinfo.ui.email.EmailActivity.Companion.inboxFolder
import com.unidy2002.thuinfo.ui.email.EmailActivity.Companion.inboxInitialized
import com.unidy2002.thuinfo.ui.email.EmailActivity.Companion.sentFolder
import com.unidy2002.thuinfo.ui.email.EmailActivity.Companion.sentInitialized
import com.unidy2002.thuinfo.ui.login.LoginActivity
import java.util.*
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.mail.Folder
import javax.mail.Message
import javax.mail.Session

@Synchronized
fun connectImap(username: String, password: String) {
    Executors.newSingleThreadExecutor().submit(Callable {
        with(LoginActivity.loginViewModel.getLoggedInUser()) {
            if (!imapStoreInitialized()) {
                imapStore = (Session.getInstance(Properties().apply {
                    put("mail.store.protocol", "imap")
                    put("mail.imap.host", username.substring(username.indexOf('@') + 1))
                }).getStore("imap") as IMAPStore).apply {
                    connect(username, password)
                }
            }
        }
    }).get(3, TimeUnit.SECONDS)
}

fun getInboxUnread() =
    try {
        with(LoginActivity.loginViewModel.getLoggedInUser()) {
            if (imapStoreInitialized()) (imapStore.getFolder("INBOX") as IMAPFolder).unreadMessageCount else 0
        }
    } catch (e: Exception) {
        e.printStackTrace()
        0
    }

@Synchronized
fun openInbox(force: Boolean = false) {
    Executors.newSingleThreadExecutor().submit(Callable {
        if (!inboxInitialized || force)
            inboxFolder =
                (LoginActivity.loginViewModel.getLoggedInUser().imapStore.getFolder("INBOX") as IMAPFolder)
                    .apply { open(Folder.READ_WRITE) }.messages.toList()
    }).get(15, TimeUnit.SECONDS)
}

@Synchronized
fun openSent(force: Boolean = false) {
    Executors.newSingleThreadExecutor().submit(Callable {
        if (!sentInitialized || force)
            sentFolder =
                (LoginActivity.loginViewModel.getLoggedInUser().imapStore.getFolder("Sent Items") as IMAPFolder)
                    .apply { open(Folder.READ_WRITE) }.messages.toList()
    }).get(15, TimeUnit.SECONDS)
}

fun getEmailList(messages: List<Message>) =
    messages.mapNotNull {
        try {
            EmailModel(it)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }.asReversed()