package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import cn.leancloud.AVOSCloud
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.util.*

class LafMainFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_laf_main, container, false)

    fun set(viewId: Int, targetId: Int, type: String) {
        view?.findViewById<Button>(viewId)?.setOnClickListener {
            NavHostFragment.findNavController(this).navigate(targetId, Bundle().apply { putString("type", type) })
        }
    }

    override fun onStart() {
        super.onStart()
        try {
            AVOSCloud.initialize(activity, lafAppId, lafAppKey, lafServerURL)
            try {
                set(R.id.laf_lost_page_btn, R.id.lafPageFragment, "lost")
                set(R.id.laf_found_page_btn, R.id.lafPageFragment, "found")
                set(R.id.laf_lost_add_btn, R.id.lafAddFragment, "lost")
                set(R.id.laf_found_add_btn, R.id.lafAddFragment, "found")
            } catch (e: Exception) {
                e.printStackTrace()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            context?.run { Toast.makeText(this, R.string.laf_exception_string, Toast.LENGTH_SHORT).show() }
        }
    }
}