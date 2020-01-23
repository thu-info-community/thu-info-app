package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.GridLayout
import androidx.core.view.children
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import com.unidy2002.thuinfo.R
import java.net.URLEncoder.encode

class ClassroomWelcomeFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? =
        inflater.inflate(R.layout.fragment_classroom_welcome, container, false)

    override fun onStart() {
        view?.findViewById<GridLayout>(R.id.classroom_welcome_grid)?.children?.forEach {
            it.setOnClickListener {
                NavHostFragment
                    .findNavController(this)
                    .navigate(
                        R.id.classroomTableFragment,
                        Bundle().apply {
                            putString(
                                "name", encode((it as Button).text.toString(), "GBK")
                            )
                        }
                    )
            }
        }
        super.onStart()
    }
}