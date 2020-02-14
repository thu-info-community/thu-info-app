package com.unidy2002.thuinfo.ui.email

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.util.Email.sendMail
import kotlin.concurrent.thread


class EmailWriteFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_email_write, container, false)

    override fun onStart() {
        super.onStart()
        view?.findViewById<Button>(R.id.write_email_send)?.setOnClickListener {
            activity?.run {
                AlertDialog.Builder(this)
                    .setTitle(R.string.send_confirm)
                    .setMessage("")
                    .setPositiveButton(R.string.confirm_string) { _, _ ->
                        it.isEnabled = false
                        thread {
                            val result = sendMail(
                                loggedInUser.emailAddress,
                                view?.findViewById<EditText>(R.id.write_email_address)?.text.toString(),
                                view?.findViewById<EditText>(R.id.write_email_subject)?.text.toString(),
                                view?.findViewById<EditText>(R.id.write_email_content)?.text.toString(),
                                loggedInUser.password
                            )
                            view?.handler?.post {
                                activity?.run {
                                    try {
                                        Toast.makeText(
                                            this,
                                            if (result) R.string.send_succeed_string else R.string.send_fail_string,
                                            Toast.LENGTH_SHORT
                                        ).show()
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                    }
                                }
                                if (result) {
                                    view?.findViewById<EditText>(R.id.write_email_address)?.text?.clear()
                                    view?.findViewById<EditText>(R.id.write_email_subject)?.text?.clear()
                                    view?.findViewById<EditText>(R.id.write_email_content)?.text?.clear()
                                }
                                it.isEnabled = true
                            }
                        }
                    }
                    .show()
            }
        }
    }
}