package com.unidy2002.thuinfo.data.model.email

import android.util.Log
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

    val from: EmailAddress

    val to: List<EmailAddress>

    val cc: List<EmailAddress>

    val bcc: List<EmailAddress>

    val subject: String

    val date: Date

    var isRead: Boolean

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
|收件人　　${to.joinToString(";")}
|抄送　　　${cc.joinToString(";")}
|密送　　　${bcc.joinToString(";")}
|主题　　　$subject
|日期　　　$date
|已读　　　$isRead
        """.trimMargin()

    class EmailFactory(private val message: Message) {
        private val mimeMessage: MimeMessage get() = message as MimeMessage

        val messageId: String get() = mimeMessage.messageID

        val from: EmailAddress
            get() = (EmailAddress(
                mimeMessage.from[0] as InternetAddress
            ))

        val to: List<EmailAddress> get() = getAddress(Message.RecipientType.TO)

        val cc: List<EmailAddress> get() = getAddress(Message.RecipientType.CC)

        val bcc: List<EmailAddress> get() = getAddress(Message.RecipientType.BCC)

        private fun getAddress(type: Message.RecipientType) =
            mimeMessage.getRecipients(type)?.map { EmailAddress(it as InternetAddress) } ?: listOf()

        val subject: String get() = mimeMessage.subject ?: "[无主题]"

        val date: Date get() = mimeMessage.sentDate

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

    class EmailAddress(internetAddress: InternetAddress) {
        private fun getName(s: String) = with(s.indexOf('@')) { if (this == -1) s else s.substring(0, this) }

        val email = internetAddress.address ?: "someone@unknown.com"
        val name = internetAddress.personal ?: getName(email)

        override fun toString() = "$name<$email>"
    }

    class EmailContent {
        lateinit var plain: String
        lateinit var html: String
        val attachments = mutableListOf<Part>()
        val inlines = mutableListOf<Part>()
        val hasPlain: Boolean get() = ::plain.isInitialized
        val hasHtml: Boolean get() = ::html.isInitialized

        fun htmlView() = html
        /*(if (inlines.isNotEmpty())
            "<p>内嵌图片暂不支持直接显示，可选择通过附件下载</p>\n"
        else "") + html +
                if (inlines.isNotEmpty()) (
                        "<p>内嵌文件：<br>" + inlines.mapIndexed { index, part ->
                            "<a href=\"javascript:thuinfo.inline($index)\">${part.fileName}</a>"
                        }.joinToString("<br>")) + "</p>" else "" +
                        if (attachments.isNotEmpty()) (
                                "<p>附件：<br>" + attachments.mapIndexed { index, part ->
                                    "<a href=\"javascript:thuinfo.attachment($index)\">${part.fileName}</a>"
                                }.joinToString("<br>")) + "</p>" else ""*/

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