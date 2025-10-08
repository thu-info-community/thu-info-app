import {getStr} from "./i18n";
import {Schedule, ScheduleType, TimeSlice, ExamTimeSlice} from "@thu-info/lib/src/models/schedule/schedule";
import {Semester} from "@thu-info/lib/src/models/schedule/calendar";
import {createEvent} from "ics";
import dayjs from "dayjs";
import {Platform} from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";

export const explainWeekList = (weekList: number[]): string => {
	const listDistinct = Array.from(new Set(weekList));
	const listSorted = listDistinct
		.filter((w) => Number.isInteger(w) && w > 0)
		.sort((a, b) => a - b);
	if (listSorted.length === 0) {
		return getStr("noWeek");
	} else if (listSorted.length === 1) {
		return getStr("weekNumPrefix") + listSorted[0] + getStr("weekNumSuffix");
	} else {
		const diff = listSorted[1] - listSorted[0];
		if (diff <= 2) {
			let consecutive = true;
			for (let i = 2; i < listSorted.length; i++) {
				const newDiff = listSorted[i] - listSorted[i - 1];
				if (newDiff !== diff) {
					consecutive = false;
					break;
				}
			}
			if (consecutive) {
				const rangeStr =
					getStr("weekNumPrefix") +
					listSorted[0] +
					"-" +
					listSorted[listSorted.length - 1] +
					getStr("weekNumSuffix");
				if (diff === 1) {
					return rangeStr;
				} else {
					return (
						rangeStr +
						getStr("lp") +
						getStr(listSorted[0] % 2 === 0 ? "evenWeeks" : "oddWeeks") +
						getStr("rp")
					);
				}
			}
		}

		const splitPoints = listSorted
			.filter((v, i, a) => v + 1 !== a[i + 1])
			.map((v) => listSorted.indexOf(v));
		const segments = splitPoints.map((p, i, a) => [
			listSorted[i === 0 ? 0 : a[i - 1] + 1],
			listSorted[p],
		]);
		return (
			getStr("weekNumPrefix") +
			segments
				.map(([beg, end]) => (beg === end ? `${beg}` : `${beg}-${end}`))
				.join(",") +
			getStr("weekNumSuffix")
		);
	}
};

export const explainPeriod = (
	dayOfWeek: number,
	periodBegin: number,
	periodEnd: number,
) => {
	return (
		getStr("dayOfWeek")[dayOfWeek] +
		" " +
		getStr("periodNumPrefix") +
		`${periodBegin}-${periodEnd}` +
		getStr("periodNumSuffix")
	);
};

export const explainWeekAndDay = (week: number, dayOfWeek: number) => {
	return (
		getStr("classroomHeaderPrefix") +
		week +
		getStr("classroomHeaderMiddle") +
		getStr("dayOfWeek")[dayOfWeek]
	);
};

/**
 * Convert the schedule to an ICS calendar format
 */
export const generateScheduleICS = (schedules: Schedule[], semester: Semester): string => {
	const PERIOD_TIME_MAP: {[key: number]: {start: string, end: string}} = {
		1: {start: "08:00", end: "08:45"},
		2: {start: "08:50", end: "09:35"},
		3: {start: "09:50", end: "10:35"},
		4: {start: "10:40", end: "11:25"},
		5: {start: "11:30", end: "12:15"},
		6: {start: "13:30", end: "14:15"},
		7: {start: "14:20", end: "15:05"},
		8: {start: "15:20", end: "16:05"},
		9: {start: "16:10", end: "16:55"},
		10: {start: "17:05", end: "17:50"},
		11: {start: "17:55", end: "18:40"},
		12: {start: "19:20", end: "20:05"},
		13: {start: "20:10", end: "20:55"},
		14: {start: "21:00", end: "21:45"},
	};

	const getScheduleTypeText = (type: ScheduleType): string => {
		switch (type) {
			case ScheduleType.PRIMARY:
				return getStr("scheduleCourseTypePrimary");
			case ScheduleType.SECONDARY:
				return getStr("scheduleCourseTypeSecondary");
			case ScheduleType.EXAM:
				return getStr("scheduleCourseTypeExam");
			case ScheduleType.CUSTOM:
				return getStr("scheduleCourseTypeCustom");
			default:
				return getStr("scheduleCourseTypeUnknown");
		}
	};

	const events: any[] = [];
	const semesterStartDate = dayjs(semester.firstDay);

	schedules.forEach((schedule) => {
		schedule.activeTime.base.forEach((timeSlice: TimeSlice) => {
			const startPeriod = PERIOD_TIME_MAP[timeSlice.begin];
			const endPeriod = PERIOD_TIME_MAP[timeSlice.end];

			if (!startPeriod || !endPeriod) {
				console.warn(`Unknown period: ${timeSlice.begin}-${timeSlice.end}`);
				return;
			}

			timeSlice.activeWeeks.forEach((week) => {
				// Calculate the absolute date & time
				const courseDate = semesterStartDate
					.add((week - 1) * 7, "day")
					.add(timeSlice.dayOfWeek - 1, "day");

				const [startHour, startMinute] = startPeriod.start.split(":").map(Number);
				const [endHour, endMinute] = endPeriod.end.split(":").map(Number);

				const startDateTime = courseDate.hour(startHour).minute(startMinute);
				const endDateTime = courseDate.hour(endHour).minute(endMinute);

				let title = schedule.name;
				if (schedule.type === ScheduleType.EXAM) {
					title = `[${getStr("scheduleCourseTypeExam")}] ${schedule.name}`;
				} else if (schedule.type === ScheduleType.CUSTOM) {
					title = `[${getStr("scheduleCourseTypeCustom")}] ${schedule.name}`;
				}

				const eventResult = createEvent({
					title,
					start: [
						startDateTime.year(),
						startDateTime.month() + 1, // ICS months are 1-indexed
						startDateTime.date(),
						startDateTime.hour(),
						startDateTime.minute()
					],
					end: [
						endDateTime.year(),
						endDateTime.month() + 1,
						endDateTime.date(),
						endDateTime.hour(),
						endDateTime.minute()
					],
					location: schedule.location || undefined,
					description: `${getStr("scheduleICSDescription")}: ${getScheduleTypeText(schedule.type)}\n` +
						`${getStr("scheduleICSTimeSlot")}: ${getStr("scheduleICSPeriod").replace("{0}", timeSlice.begin.toString()).replace("{1}", timeSlice.end.toString())}\n` +
						`${getStr("dayOfWeek")[0]}: ${getStr("dayOfWeek")[timeSlice.dayOfWeek]}\n` +
						`${getStr("weekNumPrefix")}: ${getStr("scheduleICSWeekPrefix")}${week}${getStr("scheduleICSWeekSuffix")}`,
					uid: `${schedule.hash}-${week}-${timeSlice.dayOfWeek}-${timeSlice.begin}@thu-info-app`,
				});

				if (!eventResult.error && eventResult.value) {
					events.push(eventResult.value);
				} else {
					console.error("Failed to create event:", eventResult.error);
				}
			});
		});

		if (schedule.activeTime.exams) {
			schedule.activeTime.exams.forEach((examTime: ExamTimeSlice) => {
				const examDate = semesterStartDate
					.add((examTime.weekNumber - 1) * 7, "day")
					.add(examTime.dayOfWeek - 1, "day");

				const [startHour, startMinute] = examTime.begin.split(":").map(Number);
				const [endHour, endMinute] = examTime.end.split(":").map(Number);

				const startDateTime = examDate.hour(startHour).minute(startMinute);
				const endDateTime = examDate.hour(endHour).minute(endMinute);

				const eventResult = createEvent({
					title: `[${getStr("scheduleCourseTypeExam")}] ${schedule.name}`,
					start: [
						startDateTime.year(),
						startDateTime.month() + 1,
						startDateTime.date(),
						startDateTime.hour(),
						startDateTime.minute()
					],
					end: [
						endDateTime.year(),
						endDateTime.month() + 1,
						endDateTime.date(),
						endDateTime.hour(),
						endDateTime.minute()
					],
					location: schedule.location || undefined,
					description: `${getStr("scheduleCourseTypeExam")}: ${schedule.name}\n` +
						`${getStr("scheduleICSTimeSlot")}: ${examTime.begin}-${examTime.end}\n` +
						`${getStr("dayOfWeek")[0]}: ${getStr("dayOfWeek")[examTime.dayOfWeek]}\n` +
						`${getStr("weekNumPrefix")}: ${getStr("scheduleICSWeekPrefix")}${examTime.weekNumber}${getStr("scheduleICSWeekSuffix")}`,
					uid: `${schedule.hash}-exam-${examTime.weekNumber}-${examTime.dayOfWeek}@thu-info-app`,
				});

				if (!eventResult.error && eventResult.value) {
					events.push(eventResult.value);
				} else {
					console.error("Failed to create event:", eventResult.error);
				}
			});
		}
	});

	// Return empty calendar if no events found
	if (events.length === 0) {
		return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//thu-info-app//thu-info-app//EN\r\nEND:VCALENDAR\r\n";
	}

	// Combine all events into a single ICS string
	const calendarHeader = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//thu-info-app//thu-info-app//EN\r\n";
	const calendarFooter = "END:VCALENDAR\r\n";

	const allEvents = events.join("");
	return calendarHeader + allEvents + calendarFooter;
};

/**
 * Export the schedule to an ICS file and save it to the device
 */
export const exportScheduleToICS = async (
	schedules: Schedule[],
	semester: Semester
): Promise<{success: boolean, filePath?: string, method: "download" | "share", error?: any}> => {
	try {
		const icsContent = generateScheduleICS(schedules, semester);
		const fileName = `${getStr("scheduleICSFileName")}-${semester.semesterName}.ics`;

		if (Platform.OS === "android") {
			// Android: Try to use MediaCollection API (Android 10+) or Download Manager
			try {
				const downloadDir = ReactNativeBlobUtil.fs.dirs.DownloadDir;
				const filePath = `${downloadDir}/${fileName}`;

				// This does not require storage permission on newer Android versions
				await ReactNativeBlobUtil.fs.writeFile(filePath, icsContent, "utf8");
				await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
					{
						name: fileName,
						parentFolder: "",
						mimeType: "text/calendar",
					},
					"Download",
					filePath
				);

				return {
					success: true,
					filePath: filePath,
					method: "download",
				};
			} catch {
			}
		}

		// Try to create a file in the app cache directory + share
		const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
		const filePath = `${cacheDir}/${fileName}`;

		await ReactNativeBlobUtil.fs.writeFile(filePath, icsContent, "utf8");

		return {
			success: true,
			filePath: filePath,
			method: "share",
		};
	} catch (error) {
		return {
			success: false,
			method: "share",
			error
		};
	}
};
