package com.unidy2002.thuinfo.ui.news

import android.os.Parcelable

class NewsViewModel : androidx.lifecycle.ViewModel() {
    lateinit var recyclerViewState: Parcelable
    fun recyclerViewStateInitialized() = ::recyclerViewState.isInitialized
}