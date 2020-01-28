package com.unidy2002.thuinfo.data.model

import android.util.Log
import java.text.SimpleDateFormat
import java.util.*
import javax.mail.Flags
import javax.mail.Message
import javax.mail.Multipart
import javax.mail.Part
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeMessage
import javax.mail.internet.MimeUtility

// This can also serve as a good example of implementing an email agent

class EmailModel(message: Message) {
    private val emailFactory: EmailFactory

    val messageId: String

    val from: String

    val to: String

    val cc: String

    val bcc: String

    val subject: String

    val date: String

    val isRead: Boolean

    val content: EmailContent get() = emailFactory.content

    init {
        emailFactory = EmailFactory(message)
        messageId = emailFactory.messageId
        from = emailFactory.from
        to = emailFactory.to
        cc = emailFactory.cc
        bcc = emailFactory.bcc
        subject = emailFactory.subject
        date = emailFactory.date
        isRead = emailFactory.isRead
    }

    override fun toString(): String =
        """
|邮件编号　$messageId
|发件人　　$from
|收件人　　$to
|抄送　　　$cc
|密送　　　$bcc
|主题　　　$subject
|日期　　　$date
|已读　　　$isRead
        """.trimMargin()

    class EmailFactory(private val message: Message) {
        private val mimeMessage: MimeMessage get() = message as MimeMessage

        val messageId: String get() = mimeMessage.messageID

        val from: String get() = (mimeMessage.from[0] as InternetAddress).run { "${personal ?: ""}<${address ?: ""}>" }

        val to: String get() = getMailAddress(Message.RecipientType.TO)

        val cc: String get() = getMailAddress(Message.RecipientType.CC)

        val bcc: String get() = getMailAddress(Message.RecipientType.BCC)

        private fun getMailAddress(type: Message.RecipientType) =
            mimeMessage.getRecipients(type)?.joinToString(",") {
                (it as InternetAddress).run { "${personal ?: ""}<${address ?: ""}>" }
            } ?: ""

        val subject: String get() = mimeMessage.subject

        val date: String get() = SimpleDateFormat("yyyy年MM月dd日 HH:mm:ss", Locale.CHINA).format(mimeMessage.sentDate)

        val isRead: Boolean get() = message.flags.contains(Flags.Flag.SEEN)

        private lateinit var contentValue: EmailContent

        val content: EmailContent
            get() {
                if (!::contentValue.isInitialized) {
                    val emailContent = EmailContent()

                    fun parsePart(part: Part) {
                        when {
                            part.isMimeType("text/plain") ->
                                emailContent.plain = (part.content as String)
                            part.isMimeType("text/html") ->
                                emailContent.html = (part.content as String)
                            part.disposition == Part.ATTACHMENT ->
                                emailContent.attachments.add(part)
                            part.disposition == Part.INLINE ->
                                emailContent.inlines.add(part)
                            part.isMimeType("message/rfc822") ->
                                parsePart(part.content as Part)
                            part.isMimeType("multipart/*") ->
                                (part.content as Multipart).run { (0 until count).forEach { parsePart(getBodyPart(it)) } }
                            else ->
                                Log.e("UNEXPECTED TYPE ", part.contentType)
                        }
                    }

                    parsePart(message)
                    contentValue = emailContent
                }
                return contentValue
            }
    }

    class EmailContent {
        lateinit var plain: String
        lateinit var html: String
        val attachments = mutableListOf<Part>()
        val inlines = mutableListOf<Part>()
        val hasPlain: Boolean get() = ::plain.isInitialized
        val hasHtml: Boolean get() = ::html.isInitialized

        private fun Part.decodedFileName(): String = MimeUtility.decodeText(fileName)

        override fun toString(): String {
            val result = StringBuilder()
            if (hasPlain)
                result.append("text/plain:\n$plain\n")
            if (hasHtml)
                result.append("text/html:\n$html\n")
            result.append("attachments: ${attachments.joinToString(", ") { it.decodedFileName() }}\n")
            result.append("inlines:     ${inlines.joinToString(", ") { it.decodedFileName() }}\n")
            return result.toString()
        }
    }
}