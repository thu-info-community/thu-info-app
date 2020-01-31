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
import javax.mail.Message.RecipientType.TO
import javax.mail.Session
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeBodyPart
import javax.mail.internet.MimeMessage
import javax.mail.internet.MimeMultipart


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

fun sendMail(from: String, to: String, subject: String, content: String, password: String): Boolean =
    try {
        val host = from.run { substring(indexOf('@') + 1) }
        val session = Session.getDefaultInstance(Properties().apply { put("mail.smtp.host", host) })
        val message = MimeMessage(session)
        message.setFrom(from)
        to.split(Regex("[\\s]*[,;][\\s]*")).forEach { message.addRecipient(TO, InternetAddress(it)) }
        message.subject = subject
        val multipart = MimeMultipart()
        val contentPart = MimeBodyPart()
        contentPart.setContent(content, "text/html;charset=utf-8")
        multipart.addBodyPart(contentPart)
        message.setContent(multipart)
        message.saveChanges()
        val transport = session.getTransport("smtp")
        try {
            transport.connect(host, from, password)
            transport.sendMessage(message, message.allRecipients)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        } finally {
            transport.close()
        }
    } catch (e: Exception) {
        e.printStackTrace()
        false
    }