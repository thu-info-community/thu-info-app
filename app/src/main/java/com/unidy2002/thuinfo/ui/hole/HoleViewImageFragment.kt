package com.unidy2002.thuinfo.ui.hole

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.unidy2002.thuinfo.R
import kotlinx.android.synthetic.main.fragment_web.*

class HoleViewImageFragment : Fragment() {

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_web, container, false)

    override fun onStart() {
        super.onStart()
        try {
            web_view.apply {
                settings.run {
                    builtInZoomControls = true
                    displayZoomControls = false
                }
                loadUrl(arguments?.getString("url"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            context?.run { Toast.makeText(this, R.string.load_fail_string, Toast.LENGTH_SHORT).show() }
        }
    }
}
