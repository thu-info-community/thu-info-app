package com.unidy2002.thuinfo.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProviders
import com.unidy2002.thuinfo.R

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
        val ecardBtn = view?.findViewById<Button>(R.id.ecard_btn)
        ecardBtn?.setOnClickListener {
            val fragmentTransaction = fragmentManager?.beginTransaction()
            val ecardTableFragment = EcardTableFragment()
            fragmentTransaction?.replace(R.id.nav_host_fragment, ecardTableFragment)
                ?.addToBackStack(null)
                ?.commit()
        }
        super.onStart()
    }
}