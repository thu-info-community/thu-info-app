import {scheduleConflicts, selectOccurrences} from "../../redux/scheduleData";
import {deleteScheduleOccurrences} from "../../redux/scheduleOperations";
import {useEffect, useState} from "react";
import {Alert, Text} from "react-native";
import {useDispatch, useSelector, useStore} from "react-redux";
import {getStr} from "../../utils/i18n";
import {
	Schedule,
	scheduleTimeAdd,
	ScheduleType,
	TimeSlice,
	getBeginPeriod,
	getEndPeriod,
	getWeekFromTime,
} from "@thu-info/lib/src/models/schedule/schedule";
import dayjs from "dayjs";
import {State, helper} from "../../redux/store";
import {
	Choice,
	scheduleAddCustom,
	scheduleEditDetails,
	scheduleEditCustom,
} from "../../redux/slices/schedule";
import {
	ScheduleFormModal,
	ScheduleDetailsFields,
	ScheduleTimeFields,
	ScheduleFieldSeparator,
	useScheduleFormColors,
} from "./scheduleAddForm";
import {
	ScheduleWeekField,
	SchedulePeriodField,
	ScheduleDateField,
	ScheduleTimeRangeField,
	ScheduleRepeatField,
} from "./scheduleAddPickers";

import {beginTime, endTime} from "../../utils/scheduleLayout";
export {beginTime, endTime} from "../../utils/scheduleLayout";

export interface ScheduleEditParams {
	localId: string;
	id?: number;
	name: string;
	location: string;
	week: number;
	dayOfWeek: number;
	beginTime: dayjs.Dayjs;
	endTime: dayjs.Dayjs;
	alias: string;
	type: ScheduleType;
	category?: string;
	activeWeeks?: number[];
}

interface ScheduleAddModalProps {
	visible: boolean;
	onClose: () => void;
	initialParams?: ScheduleEditParams;
	defaultDayOfWeek?: number;
	defaultDateIndex?: number;
	defaultPeriodBegin?: number;
	defaultPeriodEnd?: number;
	defaultUseCustomDateTime?: boolean;
	defaultBeginHour?: number;
	defaultBeginMinute?: number;
	defaultEndHour?: number;
	defaultEndMinute?: number;
}

export const ScheduleAddModal = ({
	visible,
	onClose,
	initialParams,
	defaultDayOfWeek,
	defaultDateIndex,
	defaultPeriodBegin,
	defaultPeriodEnd,
	defaultUseCustomDateTime,
	defaultBeginHour,
	defaultBeginMinute,
	defaultEndHour,
	defaultEndMinute,
}: ScheduleAddModalProps) => {
	const colors = useScheduleFormColors();

	const params = initialParams;

	const scheduleList = useSelector((s: State) => s.schedule.baseSchedule);

	const weekCount = useSelector((s: State) => s.config.weekCount);
	const firstDay = useSelector((s: State) => s.config.firstDay);

	const dispatch = useDispatch();
	const reduxStore = useStore<State>();

	const [weeks, setWeeks] = useState(
		params?.activeWeeks
			? params.activeWeeks
			: Array.from(new Array(weekCount), (_, k) => k + 1),
	);

	const [popupWeeks, setPopupWeeks] = useState(
		params?.activeWeeks
			? params.activeWeeks
			: Array.from(new Array(weekCount), (_, k) => k + 1),
	);

	const [day, setDay] = useState(params?.dayOfWeek ?? defaultDayOfWeek ?? 1);
	const [popupDay, setPopupDay] = useState(
		params?.dayOfWeek ?? defaultDayOfWeek ?? 1,
	);

	const [periodBegin, setPeriodBegin] = useState(
		params && params.beginTime
			? getBeginPeriod(params.beginTime)
			: (defaultPeriodBegin ?? 1),
	);
	const [periodEnd, setPeriodEnd] = useState(
		params && params.endTime
			? getEndPeriod(params.endTime)
			: (defaultPeriodEnd ?? 14),
	);

	const [popupPeriodBegin, setPopupPeriodBegin] = useState(
		params && params.beginTime
			? getBeginPeriod(params.beginTime)
			: (defaultPeriodBegin ?? 1),
	);
	const [popupPeriodEnd, setPopupPeriodEnd] = useState(
		params && params.endTime
			? getEndPeriod(params.endTime)
			: (defaultPeriodEnd ?? 14),
	);

	const [useCustomDateTime, setUseCustomDateTime] = useState(false);

	const totalDays = weekCount * 7;
	const todayIndex = (() => {
		const today = dayjs().startOf("day");
		const semesterStart = dayjs(firstDay).startOf("day");
		const diff = today.diff(semesterStart, "day");
		if (diff >= 0 && diff < totalDays) {
			return diff;
		}
		return 0;
	})();
	const [dateIndex, setDateIndex] = useState(defaultDateIndex ?? todayIndex);
	const [popupDateIndex, setPopupDateIndex] = useState(
		defaultDateIndex ?? todayIndex,
	);

	const [beginHour, setBeginHour] = useState(defaultBeginHour ?? 8);
	const [beginMinute, setBeginMinute] = useState(defaultBeginMinute ?? 0);
	const [endHour, setEndHour] = useState(defaultEndHour ?? 8);
	const [endMinute, setEndMinute] = useState(defaultEndMinute ?? 45);

	const [popupBeginHour, setPopupBeginHour] = useState(defaultBeginHour ?? 8);
	const [popupBeginMinute, setPopupBeginMinute] = useState(
		defaultBeginMinute ?? 0,
	);
	const [popupEndHour, setPopupEndHour] = useState(defaultEndHour ?? 8);
	const [popupEndMinute, setPopupEndMinute] = useState(defaultEndMinute ?? 45);

	const [repeatWeekly, setRepeatWeekly] = useState(false);

	const [title, setTitle] = useState(params?.alias ?? "");
	const [locale, setLocale] = useState(params?.location ?? "");

	useEffect(() => {
		if (!visible || params !== undefined) {
			return;
		}

		const allWeeks = Array.from(new Array(weekCount), (_, k) => k + 1);
		setWeeks(allWeeks);
		setPopupWeeks(allWeeks);

		const effectiveDay = defaultDayOfWeek ?? 1;
		setDay(effectiveDay);
		setPopupDay(effectiveDay);

		const initialPeriodBegin = defaultPeriodBegin ?? 1;
		const initialPeriodEnd = defaultPeriodEnd ?? 14;
		setPeriodBegin(initialPeriodBegin);
		setPeriodEnd(initialPeriodEnd);
		setPopupPeriodBegin(initialPeriodBegin);
		setPopupPeriodEnd(initialPeriodEnd);

		const idx = defaultDateIndex ?? todayIndex;
		setDateIndex(idx);
		setPopupDateIndex(idx);

		const bHour = defaultBeginHour ?? 8;
		const bMinute = defaultBeginMinute ?? 0;
		const eHour = defaultEndHour ?? 8;
		const eMinute = defaultEndMinute ?? 45;

		setBeginHour(bHour);
		setBeginMinute(bMinute);
		setEndHour(eHour);
		setEndMinute(eMinute);

		setPopupBeginHour(bHour);
		setPopupBeginMinute(bMinute);
		setPopupEndHour(eHour);
		setPopupEndMinute(eMinute);

		setUseCustomDateTime(defaultUseCustomDateTime ?? false);
		setRepeatWeekly(false);
		setTitle("");
		setLocale("");
	}, [
		visible,
		params,
		weekCount,
		todayIndex,
		defaultDayOfWeek,
		defaultPeriodBegin,
		defaultPeriodEnd,
		defaultDateIndex,
		defaultUseCustomDateTime,
		defaultBeginHour,
		defaultBeginMinute,
		defaultEndHour,
		defaultEndMinute,
	]);

	// When opening for edit (any schedule type), sync title and location from params so 标题/地点 default to current values.
	useEffect(() => {
		if (!visible || !params) {
			return;
		}
		setTitle(params.alias ?? "");
		setLocale(params.location ?? "");
	}, [visible, params]);

	// When editing custom schedule: init ALL time-section from current schedule; choose 上课时间 vs 自然时间 by alignment.
	// Must run on open because modal may stay mounted and useState initial values only apply on first mount.
	useEffect(() => {
		if (!visible || !params || params.type !== ScheduleType.CUSTOM) {
			return;
		}
		const currentSchedule = scheduleList.find(
			(s) => s.localId === params.localId && s.type === ScheduleType.CUSTOM,
		);
		setRepeatWeekly(false);
		const beginPeriod = getBeginPeriod(params.beginTime);
		const endPeriod = getEndPeriod(params.endTime);
		const alignsWithClassTime = beginPeriod > 0 && endPeriod > 0;

		if (currentSchedule) {
			const samePatternSlices = currentSchedule.activeTime.base.filter(
				(slice) =>
					slice.dayOfWeek === params.dayOfWeek &&
					slice.beginTime.format("HH:mm") ===
						params.beginTime.format("HH:mm") &&
					slice.endTime.format("HH:mm") === params.endTime.format("HH:mm"),
			);
			const weeksFromSchedule = [
				...new Set(
					samePatternSlices.map((slice) =>
						getWeekFromTime(slice.beginTime, firstDay),
					),
				),
			].filter((w) => w >= 1 && w <= weekCount);
			weeksFromSchedule.sort((a, b) => a - b);
			if (weeksFromSchedule.length > 0) {
				setWeeks(weeksFromSchedule);
				setPopupWeeks(weeksFromSchedule);
			}
		}

		if (alignsWithClassTime) {
			setUseCustomDateTime(false);
			setDay(params.dayOfWeek);
			setPopupDay(params.dayOfWeek);
			setPeriodBegin(beginPeriod);
			setPeriodEnd(endPeriod);
			setPopupPeriodBegin(beginPeriod);
			setPopupPeriodEnd(endPeriod);
		} else {
			setUseCustomDateTime(true);
			const dateIdx = Math.min(
				totalDays - 1,
				Math.max(0, (params.week - 1) * 7 + (params.dayOfWeek - 1)),
			);
			setDateIndex(dateIdx);
			setPopupDateIndex(dateIdx);
			const bHour = params.beginTime.hour();
			const bMinute = params.beginTime.minute();
			const eHour = params.endTime.hour();
			const eMinute = params.endTime.minute();
			setBeginHour(bHour);
			setBeginMinute(bMinute);
			setEndHour(eHour);
			setEndMinute(eMinute);
			setPopupBeginHour(bHour);
			setPopupBeginMinute(bMinute);
			setPopupEndHour(eHour);
			setPopupEndMinute(eMinute);
		}
	}, [visible, params, scheduleList, firstDay, weekCount, totalDays]);

	// Prepare for modify custom schedule's time
	// For custom schedule editing, time IS editable; for non-custom, hide the section entirely
	const isEditingCustom =
		params !== undefined && params.type === ScheduleType.CUSTOM;
	const isNonCustomEdit =
		params !== undefined && params.type !== ScheduleType.CUSTOM;

	const dateTimeValid = (() => {
		if (!useCustomDateTime) {
			return true;
		}
		if (totalDays <= 0) {
			return false;
		}
		const baseDate = dayjs(firstDay).add(dateIndex, "day");
		const begin = baseDate
			.hour(beginHour)
			.minute(beginMinute)
			.second(0)
			.millisecond(0);
		const end = baseDate
			.hour(endHour)
			.minute(endMinute)
			.second(0)
			.millisecond(0);
		return end.isAfter(begin);
	})();

	const valid =
		(title.trim().length > 0 || params !== undefined) &&
		(isNonCustomEdit ||
			(!useCustomDateTime ? weeks.length > 0 : dateTimeValid));

	const handleSave = () => {
		if (!valid) {
			return;
		}

		if (params !== undefined) {
			if (isEditingCustom) {
				// 修改自定义计划的时间
				const newActiveTime: {base: TimeSlice[]} = {base: []};

				// Also compute a single new slice for "change once" use
				let singleNewSlice: TimeSlice | null = null;

				if (!useCustomDateTime) {
					weeks.forEach((week) => {
						const courseDate = dayjs(firstDay)
							.add((week - 1) * 7, "day")
							.add(day - 1, "day");

						const beginTimeStr = beginTime[periodBegin] || "08:00";
						const endTimeStr = endTime[periodEnd] || "08:45";

						scheduleTimeAdd(newActiveTime, {
							dayOfWeek: day,
							beginTime: dayjs(
								`${courseDate.format("YYYY-MM-DD")} ${beginTimeStr}`,
							),
							endTime: dayjs(
								`${courseDate.format("YYYY-MM-DD")} ${endTimeStr}`,
							),
						});
					});

					// For "change once": use the specific week from the clicked occurrence
					const onceCourseDate = dayjs(firstDay)
						.add((params.week - 1) * 7, "day")
						.add(day - 1, "day");
					const onceBeginTimeStr = beginTime[periodBegin] || "08:00";
					const onceEndTimeStr = endTime[periodEnd] || "08:45";
					singleNewSlice = {
						dayOfWeek: day,
						beginTime: dayjs(
							`${onceCourseDate.format("YYYY-MM-DD")} ${onceBeginTimeStr}`,
						),
						endTime: dayjs(
							`${onceCourseDate.format("YYYY-MM-DD")} ${onceEndTimeStr}`,
						),
					};
				} else {
					if (totalDays <= 0) {
						Alert.alert(
							getStr("scheduleInvalidTimeTitle" as any),
							getStr("scheduleInvalidTimeMessage" as any),
						);
						return;
					}

					const baseDate = dayjs(firstDay).add(dateIndex, "day").startOf("day");
					const baseBegin = baseDate
						.hour(beginHour)
						.minute(beginMinute)
						.second(0)
						.millisecond(0);
					const baseEnd = baseDate
						.hour(endHour)
						.minute(endMinute)
						.second(0)
						.millisecond(0);

					if (!baseEnd.isAfter(baseBegin)) {
						Alert.alert(
							getStr("scheduleInvalidTimeTitle" as any),
							getStr("scheduleInvalidTimeMessage" as any),
						);
						return;
					}

					const baseDayOfWeek = baseBegin.day() === 0 ? 7 : baseBegin.day();

					// Single new slice for "change once"
					singleNewSlice = {
						dayOfWeek: baseDayOfWeek,
						beginTime: baseBegin,
						endTime: baseEnd,
					};

					if (!repeatWeekly) {
						scheduleTimeAdd(newActiveTime, {
							dayOfWeek: baseDayOfWeek,
							beginTime: baseBegin,
							endTime: baseEnd,
						});
					} else {
						const baseWeek = getWeekFromTime(baseBegin, firstDay);

						if (baseWeek > weekCount) {
							scheduleTimeAdd(newActiveTime, {
								dayOfWeek: baseDayOfWeek,
								beginTime: baseBegin,
								endTime: baseEnd,
							});
						} else {
							const startWeek = Math.max(baseWeek, 1);
							for (let w = startWeek; w <= weekCount; w++) {
								const offset = w - baseWeek;
								const begin = baseBegin.add(offset, "week");
								const end = baseEnd.add(offset, "week");
								scheduleTimeAdd(newActiveTime, {
									dayOfWeek: baseDayOfWeek,
									beginTime: begin,
									endTime: end,
								});
							}
						}
					}
				}

				const currentSchedule = scheduleList.find(
					(s) => s.localId === params.localId,
				);
				if (!currentSchedule) {
					return;
				}
				const repeatingSlices = selectOccurrences(
					currentSchedule,
					params,
					Choice.REPEAT,
					{firstDay, weekCount},
				);
				const commit = (choice: Choice, slices: TimeSlice[]) => {
					try {
						dispatch(
							scheduleEditCustom({
								localId: params.localId,
								time: params,
								choice,
								range: {firstDay, weekCount},
								name: title || params.name,
								location: locale,
								slices,
							}),
						);
						onClose();
					} catch {
						Alert.alert(getStr("networkRetry"));
					}
				};
				if (repeatingSlices.length > 1 && singleNewSlice !== null) {
					const once = singleNewSlice;
					const repeating = useCustomDateTime
						? repeatingSlices.map((slice) => ({
								dayOfWeek: once.dayOfWeek,
								beginTime: slice.beginTime.add(
									once.beginTime.diff(params.beginTime, "minute"),
									"minute",
								),
								endTime: slice.endTime.add(
									once.endTime.diff(params.endTime, "minute"),
									"minute",
								),
							}))
						: newActiveTime.base;
					Alert.alert(
						getStr("scheduleEditRepeatingTitle"),
						getStr("scheduleEditRepeatingMessage"),
						[
							{
								text: getStr("scheduleEditOnce"),
								onPress: () => commit(Choice.ONCE, [once]),
							},
							{
								text: getStr("scheduleEditAllRepeat"),
								onPress: () => commit(Choice.REPEAT, repeating),
							},
							{text: getStr("cancel"), style: "cancel"},
						],
					);
					return;
				}
				commit(Choice.ONCE, newActiveTime.base);
				return;
			}
			try {
				dispatch(
					scheduleEditDetails({
						localId: params.localId,
						alias: title || undefined,
						location: locale,
					}),
				);
				onClose();
			} catch {
				Alert.alert(getStr("networkRetry"));
			}
			return;
		}

		const newSchedule: Schedule = {
			name: title,
			location: locale,
			activeTime: {base: []},
			delOrHideTime: {base: []},
			type: ScheduleType.CUSTOM,
			hash: "",
		};

		if (!useCustomDateTime) {
			weeks.forEach((week) => {
				const courseDate = dayjs(firstDay)
					.add((week - 1) * 7, "day")
					.add(day - 1, "day");

				const beginTimeStr = beginTime[periodBegin] || "08:00";
				const endTimeStr = endTime[periodEnd] || "08:45";

				scheduleTimeAdd(newSchedule.activeTime, {
					dayOfWeek: day,
					beginTime: dayjs(
						`${courseDate.format("YYYY-MM-DD")} ${beginTimeStr}`,
					),
					endTime: dayjs(`${courseDate.format("YYYY-MM-DD")} ${endTimeStr}`),
				});
			});
		} else {
			if (totalDays <= 0) {
				Alert.alert(
					getStr("scheduleInvalidTimeTitle" as any),
					getStr("scheduleInvalidTimeMessage" as any),
				);
				return;
			}

			const baseDate = dayjs(firstDay).add(dateIndex, "day").startOf("day");
			const baseBegin = baseDate
				.hour(beginHour)
				.minute(beginMinute)
				.second(0)
				.millisecond(0);
			const baseEnd = baseDate
				.hour(endHour)
				.minute(endMinute)
				.second(0)
				.millisecond(0);

			if (!baseEnd.isAfter(baseBegin)) {
				Alert.alert(
					getStr("scheduleInvalidTimeTitle" as any),
					getStr("scheduleInvalidTimeMessage" as any),
				);
				return;
			}

			const baseDayOfWeek = baseBegin.day() === 0 ? 7 : baseBegin.day();

			if (!repeatWeekly) {
				scheduleTimeAdd(newSchedule.activeTime, {
					dayOfWeek: baseDayOfWeek,
					beginTime: baseBegin,
					endTime: baseEnd,
				});
			} else {
				const baseWeek = getWeekFromTime(baseBegin, firstDay);

				if (baseWeek > weekCount) {
					scheduleTimeAdd(newSchedule.activeTime, {
						dayOfWeek: baseDayOfWeek,
						beginTime: baseBegin,
						endTime: baseEnd,
					});
				} else {
					const startWeek = Math.max(baseWeek, 1);
					for (let w = startWeek; w <= weekCount; w++) {
						const offset = w - baseWeek;
						const begin = baseBegin.add(offset, "week");
						const end = baseEnd.add(offset, "week");
						scheduleTimeAdd(newSchedule.activeTime, {
							dayOfWeek: baseDayOfWeek,
							beginTime: begin,
							endTime: end,
						});
					}
				}
			}
		}

		const conflicts = scheduleConflicts(newSchedule, scheduleList);
		const overlapList = conflicts.map(
			({schedule, slice}): [string, ScheduleType, TimeSlice] => [
				schedule.name,
				schedule.type,
				slice,
			],
		);

		if (overlapList.length) {
			Alert.alert(
				getStr("scheduleConflict"),
				getStr("customIntro") +
					overlapList
						.map(
							(val) =>
								"「" +
								val[0] +
								"」\n" +
								getStr("weekNumPrefix") +
								getWeekFromTime(val[2].beginTime, firstDay) +
								getStr("weekNumSuffix") +
								" " +
								getStr("dayOfWeek")[val[2].dayOfWeek] +
								" " +
								(() => {
									const beginPeriod = getBeginPeriod(val[2].beginTime);
									const endPeriod = getEndPeriod(val[2].endTime);
									if (beginPeriod > 0 && endPeriod > 0) {
										return (
											getStr("periodNumPrefix") +
											beginPeriod +
											(beginPeriod === endPeriod ? "" : " ~ " + endPeriod) +
											getStr("periodNumSuffix")
										);
									}
									return (
										val[2].beginTime.format("HH:mm") +
										" ~ " +
										val[2].endTime.format("HH:mm")
									);
								})(),
						)
						.join("\n\n") +
					getStr("customText"),
				[
					{
						text: getStr("confirm"),
						onPress: async () => {
							try {
								for (const {schedule, slice} of conflicts) {
									await deleteScheduleOccurrences(
										helper,
										reduxStore,
										schedule.localId,
										slice,
										Choice.ONCE,
										{firstDay, weekCount},
									);
								}
								dispatch(scheduleAddCustom(newSchedule));
								onClose();
							} catch {
								Alert.alert(getStr("networkRetry"));
							}
						},
					},
					{
						text: getStr("cancel"),
					},
				],
			);
		} else {
			dispatch(scheduleAddCustom(newSchedule));
			onClose();
		}
	};

	return (
		<ScheduleFormModal
			visible={visible}
			colors={colors}
			editing={params !== undefined}
			valid={valid}
			onClose={onClose}
			onSave={handleSave}>
			<ScheduleDetailsFields
				colors={colors}
				title={title}
				location={locale}
				titlePlaceholder={params?.name ?? getStr("title")}
				onTitleChange={setTitle}
				onLocationChange={setLocale}
			/>
			{!isNonCustomEdit && (
				<ScheduleTimeFields
					colors={colors}
					customDateTime={useCustomDateTime}
					onModeChange={setUseCustomDateTime}>
					{useCustomDateTime ? (
						<>
							<ScheduleDateField
								colors={colors}
								firstDay={firstDay}
								totalDays={totalDays}
								value={dateIndex}
								draft={popupDateIndex}
								onDraftChange={setPopupDateIndex}
								onConfirm={() => setDateIndex(popupDateIndex)}
							/>
							<ScheduleFieldSeparator colors={colors} />
							<ScheduleTimeRangeField
								colors={colors}
								value={{beginHour, beginMinute, endHour, endMinute}}
								draft={{
									beginHour: popupBeginHour,
									beginMinute: popupBeginMinute,
									endHour: popupEndHour,
									endMinute: popupEndMinute,
								}}
								onDraftChange={(draft) => {
									setPopupBeginHour(draft.beginHour);
									setPopupBeginMinute(draft.beginMinute);
									setPopupEndHour(draft.endHour);
									setPopupEndMinute(draft.endMinute);
								}}
								onConfirm={() => {
									setBeginHour(popupBeginHour);
									setBeginMinute(popupBeginMinute);
									setEndHour(popupEndHour);
									setEndMinute(popupEndMinute);
								}}
							/>
							<ScheduleFieldSeparator colors={colors} />
							<ScheduleRepeatField
								colors={colors}
								value={repeatWeekly}
								onChange={setRepeatWeekly}
							/>
						</>
					) : (
						<>
							<ScheduleWeekField
								colors={colors}
								count={weekCount}
								value={weeks}
								draft={popupWeeks}
								onDraftChange={setPopupWeeks}
								onConfirm={() => setWeeks(popupWeeks)}
							/>
							<ScheduleFieldSeparator colors={colors} />
							<SchedulePeriodField
								colors={colors}
								value={{day, begin: periodBegin, end: periodEnd}}
								draft={{
									day: popupDay,
									begin: popupPeriodBegin,
									end: popupPeriodEnd,
								}}
								onDraftChange={(draft) => {
									setPopupDay(draft.day);
									setPopupPeriodBegin(draft.begin);
									setPopupPeriodEnd(draft.end);
								}}
								onConfirm={() => {
									setDay(popupDay);
									setPeriodBegin(popupPeriodBegin);
									setPeriodEnd(popupPeriodEnd);
								}}
							/>
						</>
					)}
				</ScheduleTimeFields>
			)}
			{params !== undefined && (
				<Text
					style={{
						color: colors.formText,
						fontSize: 12,
						textAlign: "center",
						marginTop: 16,
						marginBottom: 8,
					}}>
					{getStr("scheduleLongPressHint")}
				</Text>
			)}
		</ScheduleFormModal>
	);
};
