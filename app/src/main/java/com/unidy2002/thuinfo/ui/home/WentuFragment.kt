package com.unidy2002.thuinfo.ui.home

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.*
import androidx.lifecycle.Observer
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.network.getWentuState
import java.util.*
import kotlin.concurrent.schedule
import kotlin.concurrent.thread

class WentuFragment : Fragment() {
    private lateinit var viewModel: WentuViewModel
    private lateinit var dataTimer: TimerTask

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        viewModel = ViewModelProvider(this).get(WentuViewModel::class.java)
        return inflater.inflate(R.layout.fragment_wentu, container, false)
    }

    override fun onStart() {
        super.onStart()
        viewModel.run {
            view?.findViewById<RecyclerView>(R.id.wentu_recycler_view)?.apply {
                wentuData.observe(this@WentuFragment, Observer {
                    it?.run {
                        view?.findViewById<TextView>(R.id.wentu_title)?.setText(
                            if (isEmpty()) R.string.wentu_title_fail_string else R.string.wentu_title_string
                        )
                        if (isNotEmpty()) adapter = WentuAdapter(this)
                    }
                })
                layoutManager = LinearLayoutManager(context)
                adapter = WentuAdapter(listOf())
            }

            dataTimer = Timer().schedule(0, 20000) { getData() }
        }

        view?.findViewById<Button>(R.id.wentu_reserve_btn)?.setOnClickListener {
            context?.run {
                AlertDialog.Builder(this)
                    .setTitle(R.string.wentu_rule_title)
                    .setMessage(R.string.wentu_rule_content)
                    .setPositiveButton(R.string.confirm_string) { _, _ ->
                        NavHostFragment.findNavController(this@WentuFragment)
                            .navigate(R.id.wentuReserveFragment)
                    }
                    .setNegativeButton(R.string.cancel_string) { _, _ -> }
                    .show()

            }
        }
    }

    override fun onStop() {
        if (::dataTimer.isInitialized) dataTimer.cancel()
        super.onStop()
    }

    class WentuViewModel : ViewModel() {
        private val _wentuData = MutableLiveData<List<Pair<String, Pair<Int, Int>>>>()
        val wentuData: LiveData<List<Pair<String, Pair<Int, Int>>>> = _wentuData

        fun getData() {
            thread { _wentuData.postValue(getWentuState()) }
        }
    }

    inner class WentuAdapter(val data: List<Pair<String, Pair<Int, Int>>>) :
        RecyclerView.Adapter<RecyclerView.ViewHolder>() {

        inner class WentuViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val name: TextView? = view.findViewById(R.id.wentu_data_name)
            val value: TextView? = view.findViewById(R.id.wentu_data_value)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            WentuViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_wentu_data, parent, false))

        override fun getItemCount() = data.size

        override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
            holder as WentuViewHolder
            with(data[position]) {
                holder.name?.text = first
                holder.value?.text =
                    resources.getString(R.string.wentu_data_template, second.second, second.first + second.second)
            }
        }
    }
}