package com.unidy2002.thuinfo.ui.hole

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.navigation.fragment.NavHostFragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.postNewHole
import com.unidy2002.thuinfo.data.util.safeThread
import kotlinx.android.synthetic.main.fragment_hole_post.*

class HolePostFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_hole_post, container, false)

    override fun onStart() {
        super.onStart()

        hole_new_post_submit.run {
            setOnClickListener {
                isEnabled = false
                safeThread {
                    if (Network.postNewHole(hole_new_post_input.text.toString())) {
                        handler.post {
                            context?.run { Toast.makeText(this, hole_publish_success, Toast.LENGTH_SHORT).show() }
                            NavHostFragment.findNavController(this@HolePostFragment).navigateUp()
                        }
                    } else {
                        handler.post {
                            context?.run { Toast.makeText(this, hole_publish_failure, Toast.LENGTH_SHORT).show() }
                        }
                        isEnabled = true
                    }
                }
            }
        }

        hole_new_post_input.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable) {
                hole_new_post_submit.isEnabled = s.isNotBlank()
            }

            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }
}
