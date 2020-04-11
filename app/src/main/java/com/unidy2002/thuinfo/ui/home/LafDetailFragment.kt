package com.unidy2002.thuinfo.ui.home

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.View.VISIBLE
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.R
import kotlinx.android.synthetic.main.fragment_laf_detail.*

class LafDetailFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_laf_detail, container, false)

    override fun onStart() {
        super.onStart()
        view?.run {
            (arguments?.getSerializable("data") as? LafPageFragment.LafItem)?.run {
                laf_detail_subject.text = subject
                laf_detail_locale.text = locale
                laf_detail_time.text = time
                laf_detail_detail.text = detail
                laf_detail_contact.text = contact
                laf_detail_show_contact.setOnClickListener {
                    AlertDialog.Builder(context)
                        .setMessage(R.string.please_confirm_identity)
                        .setPositiveButton(R.string.confirm_string) { _, _ ->
                            it.isEnabled = false
                            findViewById<TextView>(R.id.laf_detail_contact)?.visibility = VISIBLE
                        }
                        .show()
                }
            }
        }
    }
}