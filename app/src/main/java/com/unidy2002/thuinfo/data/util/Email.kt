package com.unidy2002.thuinfo.data.util

import android.graphics.Color
import com.sun.mail.imap.IMAPFolder
import com.sun.mail.imap.IMAPStore
import com.unidy2002.thuinfo.data.model.email.EmailListModel
import com.unidy2002.thuinfo.data.model.email.EmailModel
import com.unidy2002.thuinfo.ui.login.LoginActivity
import java.text.SimpleDateFormat
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

object Email {
    val folder = mutableMapOf<String, List<Message>>()
    private val locked = mutableMapOf("inbox" to false, "sent items" to false)

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
                if (imapStoreInitialized()) (imapStore.getFolder("inbox") as IMAPFolder).unreadMessageCount else 0
            }
        } catch (e: Exception) {
            e.printStackTrace()
            0
        }

    fun openFolder(name: String, force: Boolean = false) {
        if (locked[name] == false) {
            locked[name] = true
            Executors.newSingleThreadExecutor().submit(Callable {
                if (name !in folder || force)
                    folder[name] =
                        (LoginActivity.loginViewModel.getLoggedInUser().imapStore.getFolder(name) as IMAPFolder)
                            .apply { open(Folder.READ_WRITE) }.messages.reversed()
            }).get(15, TimeUnit.SECONDS)
            locked[name] = false
        }
    }

    fun getEmailList(folder: String, messages: List<Message>, startIndex: Int) =
        messages.subList(startIndex, (startIndex + 15).coerceAtMost(messages.size)).map {
            try {
                with(EmailModel(it)) {
                    EmailListModel(
                        subject,
                        if (isRead) Color.rgb(64, 64, 64) else Color.rgb(0, 133, 119),
                        if (folder == "inbox") from.name else to.joinToString { address -> address.name },
                        SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).format(date)
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
                EmailListModel("加载失败", Color.rgb(64, 64, 64), "", "")
            }
        }

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
}