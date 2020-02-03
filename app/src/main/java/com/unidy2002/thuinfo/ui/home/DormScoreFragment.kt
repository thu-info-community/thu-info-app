package com.unidy2002.thuinfo.ui.home

import android.graphics.drawable.Drawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.util.Network
import kotlin.concurrent.thread

class DormScoreFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_dorm_score, container, false)

    override fun onStart() {
        thread {
            val result = Network().getDormScore()
            view?.handler?.post {
                if (result == null)
                    Toast.makeText(context, R.string.network_exception_string, Toast.LENGTH_SHORT).show()
                else
                    Glide.with(this)
                        .load(result)
                        .listener(object : RequestListener<Drawable> {
                            override fun onLoadFailed(
                                e: GlideException?,
                                model: Any?,
                                target: Target<Drawable>?,
                                isFirstResource: Boolean
                            ): Boolean {
                                Toast.makeText(context, R.string.load_fail_string, Toast.LENGTH_SHORT).show()
                                view?.findViewById<ProgressBar>(R.id.dorm_score_loading)?.visibility = View.GONE
                                e?.printStackTrace()
                                return false
                            }

                            override fun onResourceReady(
                                resource: Drawable?,
                                model: Any?,
                                target: Target<Drawable>?,
                                dataSource: DataSource?,
                                isFirstResource: Boolean
                            ): Boolean {
                                view?.findViewById<ProgressBar>(R.id.dorm_score_loading)?.visibility = View.GONE
                                return false
                            }
                        })
                        .into(view!!.findViewById(R.id.dorm_score_image))
            }
        }
        super.onStart()
    }
}