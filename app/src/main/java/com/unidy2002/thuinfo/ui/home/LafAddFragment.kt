package com.unidy2002.thuinfo.ui.home

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.annotation.StringRes
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import cn.leancloud.AVObject
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.ui.home.LafAddFragment.TYPE.FOUND
import com.unidy2002.thuinfo.ui.home.LafAddFragment.TYPE.LOST
import io.reactivex.Observer
import io.reactivex.disposables.Disposable

class LafAddFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_laf_add, container, false)

    private var type = LOST
    private var subject: EditText? = null
    private var time: EditText? = null
    private var locale: EditText? = null
    private var detail: EditText? = null
    private var contact: EditText? = null

    @StringRes
    private fun check() = when {
        subject?.text.isNullOrBlank() -> please_enter_subject
        time?.text.isNullOrBlank() -> please_enter_time
        locale?.text.isNullOrBlank() -> please_enter_locale
        contact?.text.isNullOrBlank() -> please_enter_contact
        else -> null
    }

    override fun onStart() {
        super.onStart()
        if (arguments?.getString("type") == "found") type = FOUND
        view?.run {
            subject = findViewById(R.id.laf_add_subject_edit)
            time = findViewById<EditText>(R.id.laf_add_time_edit)?.also {
                it.setHint(
                    when (type) {
                        LOST -> time_lost_hint
                        FOUND -> time_found_hint
                    }
                )
            }
            locale = findViewById<EditText>(R.id.laf_add_locale_edit)?.also {
                it.setHint(
                    when (type) {
                        LOST -> locale_lost_hint
                        FOUND -> locale_found_hint
                    }
                )
            }
            detail = findViewById<EditText>(R.id.laf_add_detail_edit)?.also {
                it.setHint(
                    when (type) {
                        LOST -> detail_lost_hint
                        FOUND -> detail_found_hint
                    }
                )
            }
            contact = findViewById(R.id.laf_add_contact_edit)
            findViewById<Button>(R.id.laf_publish_btn)?.setOnClickListener {
                try {
                    with(check()) {
                        if (this == null)
                            AlertDialog.Builder(context)
                                .setMessage(laf_publish_warning)
                                .setPositiveButton(confirm_string) { _, _ ->
                                    try {
                                        AVObject("data").run {
                                            put("type", type)
                                            put("subject", subject?.text.toString())
                                            put("time", time?.text.toString())
                                            put("locale", locale?.text.toString())
                                            put("detail", detail?.text.toString())
                                            put("contact", contact?.text.toString())
                                            put("id", loggedInUser.userId)
                                            saveInBackground().subscribe(object : Observer<AVObject> {
                                                override fun onComplete() {
                                                    NavHostFragment.findNavController(this@LafAddFragment).navigateUp()
                                                    context?.run {
                                                        Toast.makeText(this, publish_succeed_string, Toast.LENGTH_SHORT)
                                                            .show()
                                                    }
                                                }

                                                override fun onSubscribe(d: Disposable) {}
                                                override fun onNext(t: AVObject) {}

                                                override fun onError(e: Throwable) {
                                                    context?.run {
                                                        Toast.makeText(
                                                            this,
                                                            publish_exception_string,
                                                            Toast.LENGTH_SHORT
                                                        ).show()
                                                    }
                                                    e.printStackTrace()
                                                }
                                            })
                                        }
                                    } catch (e: Exception) {
                                        context?.run {
                                            Toast.makeText(this, publish_exception_string, Toast.LENGTH_SHORT).show()
                                        }
                                        e.printStackTrace()
                                    }
                                }
                                .setNegativeButton(cancel_string) { _, _ -> }
                                .show()
                        else
                            AlertDialog.Builder(context)
                                .setMessage(this)
                                .setPositiveButton(confirm_string) { _, _ -> }
                                .show()
                    }
                } catch (e: Exception) {
                    context?.run { Toast.makeText(this, publish_exception_string, Toast.LENGTH_SHORT).show() }
                    e.printStackTrace()
                }
            }
        }
    }

    internal enum class TYPE { LOST, FOUND }
}