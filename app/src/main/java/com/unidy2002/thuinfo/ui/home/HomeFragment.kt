package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.ViewModelProviders
import com.bin.david.form.core.SmartTable
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.EcardTable
import com.unidy2002.thuinfo.userModel

class HomeFragment : Fragment() {

    private lateinit var homeViewModel: HomeViewModel

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        homeViewModel =
            ViewModelProviders.of(this).get(HomeViewModel::class.java)
        return inflater.inflate(R.layout.fragment_home, container, false)
    }

    override fun onStart() {
        try {
            val calenderBtn = view?.findViewById<Button>(R.id.calender_btn)
            calenderBtn?.setOnClickListener {
                if (userModel.calenderInitialized()) {
                    var preview = userModel.calender.lessonList.toString()
                    preview = preview.substring(0, 500) + "..."
                    AlertDialog.Builder(view?.context!!)
                        .setTitle("抓包结果预览")
                        .setMessage(
                            preview
                        )
                        .show()
                } else {
                    AlertDialog.Builder(view?.context!!)
                        .setTitle("抓包结果预览")
                        .setMessage(
                            "加载中，请稍后重试……"
                        )
                        .show()
                }
            }

            val ecardBtn = view?.findViewById<Button>(R.id.ecard_btn)
            ecardBtn?.setOnClickListener {
                val fragmentTransaction = fragmentManager?.beginTransaction()
                val ecardTableFragment = EcardTableFragment()
                fragmentTransaction?.replace(R.id.nav_host_fragment, ecardTableFragment)
                    ?.addToBackStack(null)
                    ?.commit()
            }

        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onStart()
    }
}