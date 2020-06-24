package com.unidy2002.thuinfo.ui.hole

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.R.string.*
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.postNewHole
import com.unidy2002.thuinfo.data.util.safeThread
import com.wildma.pictureselector.PictureSelector
import kotlinx.android.synthetic.main.fragment_hole_post.*

class HolePostFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_hole_post, container, false)

    private fun post(withImg: Boolean) {
        safeThread {
            hole_new_post_submit.run {
                if (Network.postNewHole(hole_new_post_input.text.toString(), withImg)) {
                    handler.post {
                        context?.run { Toast.makeText(this, hole_publish_success, Toast.LENGTH_SHORT).show() }
                        loggedInUser.currentImageBase64 = ""
                        NavHostFragment.findNavController(this@HolePostFragment).navigateUp()
                    }
                } else {
                    handler.post {
                        context?.run { Toast.makeText(this, hole_publish_failure, Toast.LENGTH_SHORT).show() }
                        isEnabled = true
                    }
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()

        hole_new_post_submit.setOnClickListener {
            hole_new_post_submit.isEnabled = false
            if (loggedInUser.currentImageBase64.isBlank()) {
                post(false)
            } else {
                AlertDialog.Builder(context)
                    .setTitle(confirm_send_img_str)
                    .setPositiveButton(yes_str) { _, _ -> post(true) }
                    .setNegativeButton(no_str) { _, _ -> post(false) }
                    .setCancelable(false)
                    .show()
            }
        }

        hole_new_post_input.doOnTextChanged { text, _, _, _ -> hole_new_post_submit.isEnabled = !text.isNullOrBlank() }

        hole_add_image.run {
            setOnClickListener {
                if (loggedInUser.currentImageBase64.isBlank()) {
                    PictureSelector
                        .create(activity, PictureSelector.SELECT_REQUEST_CODE)
                        .selectPicture(true)
                } else {
                    AlertDialog.Builder(context)
                        .setTitle(confirm_delete_img_str)
                        .setPositiveButton(yes_str) { _, _ ->
                            setText(add_image_string)
                            loggedInUser.currentImageBase64 = ""
                        }
                        .setNegativeButton(no_str) { _, _ -> }
                        .show()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        hole_add_image.setText(if (loggedInUser.currentImageBase64.isBlank()) add_image_string else delete_image_string)
    }

    override fun onDestroy() {
        super.onDestroy()
        loggedInUser.currentImageBase64 = ""
    }
}
