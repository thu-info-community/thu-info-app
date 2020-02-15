package com.unidy2002.thuinfo.ui.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

class ConfigureCommunityViewModel : ViewModel() {
    private val _runOnCallback = MutableLiveData<() -> Unit>()
    val runOnCallBack: LiveData<() -> Unit> = _runOnCallback

    fun setRunOnCallBack(block: () -> Unit) {
        _runOnCallback.postValue(block)
    }

    private val _configureResult = MutableLiveData<Boolean>()
    val configureResult: LiveData<Boolean> = _configureResult

    fun setConfigureResult(result: Boolean) {
        _configureResult.postValue(result)
    }
}