package com.unidy2002.thuinfo.ui.news

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProviders
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.NewsCard
import com.unidy2002.thuinfo.data.model.NewsCardAdapter


class NewsFragment : Fragment() {

    private lateinit var newsViewModel: NewsViewModel

    private val newsCardList: MutableList<NewsCard> = ArrayList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        newsViewModel = ViewModelProviders.of(this).get(NewsViewModel::class.java)
        return inflater.inflate(R.layout.fragment_news, container, false)
    }

    private fun initialize() {
        repeat(10) {
            newsCardList.add(
                NewsCard(
                    0,
                    "2020-01-13",
                    "教务处",
                    "为丰富学生选择，加强教学资源共享，促进学术和学生交流，清华大学与北京大学两校教务部门研究决定互相……",
                    ""
                )
            )
        }
    }

    override fun onStart() {
        initialize()
        val recyclerView = view?.findViewById<RecyclerView>(R.id.recycler_view)!!
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = NewsCardAdapter(newsCardList).apply {
            setOnItemClickListener(object : NewsCardAdapter.OnItemClickListener {
                override fun onClick(position: Int) {
                    Toast.makeText(context, "Click $position", Toast.LENGTH_SHORT).show()
                }
            })

            setOnItemLongClickListener(object : NewsCardAdapter.OnItemLongClickListener {
                override fun onLongClick(position: Int) {
                    Toast.makeText(context, "Long click $position", Toast.LENGTH_SHORT).show()
                }
            })
        }

        super.onStart()
    }
}