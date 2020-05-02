package com.unidy2002.thuinfo.ui.schedule

import androidx.annotation.StringRes
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.unidy2002.thuinfo.R
import com.unidy2002.thuinfo.data.dao.ScheduleDBManager
import com.unidy2002.thuinfo.data.model.login.loggedInUser
import com.unidy2002.thuinfo.data.network.Network
import com.unidy2002.thuinfo.data.network.getSchedule
import com.unidy2002.thuinfo.data.util.SchoolCalendar

class ScheduleViewModel : androidx.lifecycle.ViewModel() {

    private val _scheduleData = MutableLiveData<ScheduleResult>()
    val scheduleData: LiveData<ScheduleResult> = _scheduleData

    private val _scheduleWeek = MutableLiveData<Int>()
    val scheduleWeek: LiveData<Int> = _scheduleWeek

    fun getData(force: Boolean) {
        _scheduleData.postValue(
            if (loggedInUser.scheduleInitialized() && (!force || Network.getSchedule()))
                ScheduleResult(success = loggedInUser.schedule)
            else ScheduleResult(error = R.string.load_fail_string)
        )
    }

    fun addCustom(lesson: ScheduleDBManager.Lesson) {
        loggedInUser.schedule.apply {
            addCustom(lesson)
            _scheduleData.postValue(ScheduleResult(success = this))
        }
    }

    fun delCustom(title: String, session: ScheduleDBManager.Session? = null) {
        loggedInUser.schedule.apply {
            delCustom(title, session)
            _scheduleData.postValue(ScheduleResult(success = this))
        }
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
        val success: ScheduleDBManager? = null,
        @StringRes val error: Int? = null
    )
}