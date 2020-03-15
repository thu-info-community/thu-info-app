package com.unidy2002.thuinfo.ui.home

import android.content.Context.MODE_PRIVATE
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.observe
import androidx.navigation.fragment.NavHostFragment
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getTicket
import com.unidy2002.thuinfo.data.util.encrypt
import kotlin.concurrent.thread

class ConfigureCommunityFragment : Fragment() {

    private lateinit var viewModel: ConfigureCommunityViewModel

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        viewModel = activity?.run {
            ViewModelProvider(this).get(ConfigureCommunityViewModel::class.java)
        } ?: ViewModelProvider(this).get(ConfigureCommunityViewModel::class.java)
        return inflater.inflate(R.layout.fragment_configure_community, container, false)
    }

    override fun onStart() {
        super.onStart()
        view?.run {
            findViewById<EditText>(R.id.community_username).setText(loggedInUser.userId)

            findViewById<EditText>(R.id.community_password).doOnTextChanged { text, _, _, _ ->
                findViewById<Button>(R.id.community_login).isEnabled = !text.isNullOrEmpty()
            }

            findViewById<Button>(R.id.community_login).setOnClickListener {
                findViewById<ProgressBar>(R.id.community_loading).visibility = View.VISIBLE
                findViewById<Button>(R.id.community_login).isEnabled = false
                thread {
                    loggedInUser.communityPassword = findViewById<EditText>(R.id.community_password).text.toString()
                    Network.getTicket(-1)
                    viewModel.setConfigureResult(loggedInUser.communityLoggedIn)
                }
            }

            // TODO: improve user experience
            findViewById<TextView>(R.id.community_forget_password).setOnClickListener {
                activity?.run { Toast.makeText(this, "这一块目前做得不大好，敬请期待……", Toast.LENGTH_LONG).show() }
                startActivity(
                    Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse("https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fdee49932a3526446d0187ab9040227bca90a6e14cc9/forgot_password.aspx")
                    )
                )
            }

            viewModel.configureResult.observe(this@ConfigureCommunityFragment) {
                if (loggedInUser.connectionState[-1] == false) {
                    findViewById<ProgressBar>(R.id.community_loading).visibility = View.INVISIBLE
                    if (it) {
                        NavHostFragment.findNavController(this@ConfigureCommunityFragment).navigateUp()
                        viewModel.runOnCallBack.value?.invoke()
                        activity?.getSharedPreferences(loggedInUser.userId, MODE_PRIVATE)?.edit()?.run {
                            encrypt("c${loggedInUser.userId}", loggedInUser.communityPassword).run {
                                putString("civ", first)
                                putString("cpe", second)
                            }
                            apply()
                        }
                    } else {
                        findViewById<Button>(R.id.community_login).isEnabled = true
                        context?.run { Toast.makeText(this, R.string.login_failed, Toast.LENGTH_SHORT).show() }
                    }
                }
            }
        }
    }
}