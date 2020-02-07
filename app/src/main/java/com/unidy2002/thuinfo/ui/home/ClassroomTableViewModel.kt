package com.unidy2002.thuinfo.ui.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.unidy2002.thuinfo.data.util.Network
import com.unidy2002.thuinfo.data.util.SchoolCalendar
import kotlin.concurrent.thread

class ClassroomTableViewModel : ViewModel() {
    private val _prev = MutableLiveData<ClassroomResult>()
    private val _curr = MutableLiveData<ClassroomResult>()
    private val _next = MutableLiveData<ClassroomResult>()
    val curr: LiveData<ClassroomResult> = _curr

    private val _currentWeek = MutableLiveData<Int>()
    val currentWeek: LiveData<Int> = _currentWeek
    private val _currentDay = MutableLiveData<Int>()
    val currentDay: LiveData<Int> = _currentDay

    lateinit var classroom: String

    fun setDate(schoolCalendar: SchoolCalendar) {
        when {
            schoolCalendar.weekNumber > SchoolCalendar.weekCount -> {
                _currentWeek.postValue(SchoolCalendar.weekCount)
                _currentDay.postValue(7)
            }
            schoolCalendar.weekNumber > 0 -> {
                _currentWeek.postValue(schoolCalendar.weekNumber)
                _currentDay.postValue(schoolCalendar.dayOfWeek)
            }
            else -> {
                _currentWeek.postValue(1)
                _currentDay.postValue(1)
            }
        }
    }

    fun dateIncrease() {
        _currentDay.value?.run {
            if (this == 7) {
                _currentWeek.value?.run {
                    if (this < 18) {
                        _currentWeek.postValue(this + 1)
                        _currentDay.postValue(1)
                    }
                }
            } else {
                _currentDay.postValue(this + 1)
            }
        }
    }

    fun dateDecrease() {
        _currentDay.value?.run {
            if (this == 1) {
                _currentWeek.value?.run {
                    if (this > 1) {
                        _currentWeek.postValue(this - 1)
                        _currentDay.postValue(7)
                    }
                }
            } else {
                _currentDay.postValue(this - 1)
            }
        }
    }

    fun getData(increment: Int) {
        _currentWeek.value?.run {
            val currentLoading = this + increment
            if (currentLoading in 1..SchoolCalendar.weekCount && ::classroom.isInitialized) {
                val data = Network.getClassroomState(classroom, currentLoading)
                _currentWeek.value?.run {
                    if (currentLoading == this + increment) {
                        when (increment) {
                            0 -> _curr
                            1 -> _next
                            -1 -> _prev
                            else -> null
                        }?.postValue(
                            if (data == null)
                                ClassroomResult(currentLoading, error = ClassroomErrorReason.LOAD_FAILURE)
                            else
                                ClassroomResult(currentLoading, success = data)
                        )
                    }
                }
            }
        }
    }

    fun shiftData(target: Int) {
        when (_curr.value?.weekNumber) {
            target -> {
            }
            target + 1 -> {
                _next.postValue(_curr.value)
                when {
                    _prev.value?.error == ClassroomErrorReason.LOAD_FAILURE -> {
                        _curr.postValue(ClassroomResult(target, error = ClassroomErrorReason.CACHE_FAILURE))
                    }
                    _prev.value?.success != null -> {
                        _curr.postValue(_prev.value)
                    }
                    else -> {
                        thread { getData(0) }
                    }
                }
                thread { getData(-1) }
            }
            target - 1 -> {
                _prev.postValue(_curr.value)
                when {
                    _next.value?.error == ClassroomErrorReason.LOAD_FAILURE -> {
                        _curr.postValue(ClassroomResult(target, error = ClassroomErrorReason.CACHE_FAILURE))
                    }
                    _next.value?.success != null -> {
                        _curr.postValue(_next.value)
                    }
                    else -> {
                        thread { getData(0) }
                    }
                }
                thread { getData(1) }
            }
            else -> {
                initialize()
            }
        }
    }

    fun initialize() {
        thread { getData(0) }
        thread { getData(1) }
        thread { getData(-1) }
    }

    data class ClassroomResult(
        val weekNumber: Int,
        val success: List<Pair<String, List<Int>>>? = null,
        val error: ClassroomErrorReason? = null
    )

    enum class ClassroomErrorReason { LOAD_FAILURE, CACHE_FAILURE }
}