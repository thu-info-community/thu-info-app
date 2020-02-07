package com.unidy2002.thuinfo.ui.schedule

import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.model.schedule.Schedule
import com.unidy2002.thuinfo.data.util.Network
import com.unidy2002.thuinfo.data.util.SchoolCalendar

class ScheduleViewModel : androidx.lifecycle.ViewModel() {

    private val _scheduleData = MutableLiveData<ScheduleResult>()
    val scheduleData: LiveData<ScheduleResult> = _scheduleData

    private val _scheduleWeek = MutableLiveData<Int>()
    val scheduleWeek: LiveData<Int> = _scheduleWeek

    fun getData(context: Context?, force: Boolean = false) {
        _scheduleData.postValue(with(Network.getSchedule(context, force)) {
            if (this == null)
                ScheduleResult(error = R.string.load_fail_string)
            else
                ScheduleResult(success = this)
        })
    }

    fun setWeek(week: Int) {
        _scheduleWeek.postValue(
            when {
                week < 1 -> 1
                week > SchoolCalendar.weekCount -> SchoolCalendar.weekCount
                else -> week
            }
        )
    }

    fun weekIncrease() {
        _scheduleWeek.value?.run { if (this < SchoolCalendar.weekCount) _scheduleWeek.postValue(this + 1) }
    }

    fun weekDecrease() {
        _scheduleWeek.value?.run { if (this > 1) _scheduleWeek.postValue(this - 1) }
    }

    data class ScheduleResult(
        val success: Schedule? = null,
        val error: Int? = null
    )
}