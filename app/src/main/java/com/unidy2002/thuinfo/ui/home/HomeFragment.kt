package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProviders
import com.unidy2002.thuinfo.R
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
        val root = inflater.inflate(R.layout.fragment_home, container, false)
        val textView: TextView = root.findViewById(R.id.text_home)
        homeViewModel.text.observe(this, Observer {
            textView.text = it
        })



        return root
    }

    override fun onStart() {
        try {
            val btn = view?.findViewById<Button>(R.id.calender_btn)
            btn?.setOnClickListener {
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
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onStart()
    }
}