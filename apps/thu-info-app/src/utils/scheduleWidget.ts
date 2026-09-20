import dayjs, {Dayjs} from "dayjs";
import md5 from "md5";
import {AppState, DeviceEventEmitter, Platform} from "react-native";
import {
	getWeekFromTime,
	ScheduleType,
	TimeSlice,
} from "@thu-info/lib/src/models/schedule/schedule";
import themes from "../assets/themes/themes";
import {navigationRef, persistor, State, store} from "../redux/store";
import {StoredSchedule} from "../redux/scheduleData";
import {DayScheduleItem, selectDaySchedule} from "./scheduleQuery";
import {
	buildScheduleLayout,
	formatScheduleMinute,
	ScheduleLayoutEntry,
} from "./scheduleLayout";

export interface WidgetScheduleItem {
	name: string;
	loc: string;
	from: string;
	to: string;
	begin: number;
	end: number;
	color: string;
}

export interface WidgetDay {
	dayOfWeek: number;
	date: string;
	// Localized short weekday name, resolved app-side so the cards never need
	// locale APIs (which are restricted in the form render process).
	label: string;
	// Full date line for the Today card header, in the app language.
	dateText: string;
	items: WidgetScheduleItem[];
}

export interface WidgetWeekRow {
	kind: "period" | "gap" | "hour";
	period?: number;
	begin: string;
	end: string;
	top: number;
	height: number;
}

export interface WidgetWeekBlock extends WidgetScheduleItem {
	dayOfWeek: number;
	top: number;
	height: number;
	timeLabel: string;
	compact: boolean;
	fill: string;
	textColor: string;
}

export interface WidgetWeekView {
	week: number;
	days: WidgetDay[];
	rows: WidgetWeekRow[];
	blocks: WidgetWeekBlock[];
	classPeriods: boolean;
	showWeekend: boolean;
	showAxisTimes: boolean;
}

export interface WidgetSnapshot {
	v: 1;
	generatedAt: number;
	week: number;
	// Resolved app language; the Android cards resolve their string resources
	// against it so the UI never mixes the app language with the system's.
	language: "zh" | "en";
	today: WidgetDay;
	tomorrow: WidgetDay;
	// Seven consecutive days starting today, used by the next-item fallback.
	nextDays: WidgetDay[];
	// Additive and optional so a card can still read a persisted v1 snapshot
	// written by an older app build until the first refresh arrives.
	weekView?: WidgetWeekView;
	empty: boolean;
}

const toWidgetItem = (item: DayScheduleItem): WidgetScheduleItem => ({
	name: item.name,
	loc: item.location,
	from: item.from,
	to: item.to,
	begin: item.beginTime.valueOf(),
	end: item.endTime.valueOf(),
	color: item.color,
});

const WEEKDAY_ZH = ["一", "二", "三", "四", "五", "六", "日"];
const WEEKDAY_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// The cards speak the app's language instead of the launcher's system locale
// so they never mix the two ("auto" follows the system).
const resolveLanguage = (language: string): "zh" | "en" => {
	if (language === "zh" || language === "en") {
		return language;
	}
	try {
		// Lazily required: unavailable in some environments (e.g. tests).
		const {getLocales} = require("react-native-localize");
		return getLocales()[0]?.languageTag.startsWith("zh") ? "zh" : "en";
	} catch {
		return "zh";
	}
};

const weekdayLabel = (language: "zh" | "en", dayOfWeek: number): string =>
	language === "en" ? WEEKDAY_EN[dayOfWeek - 1] : WEEKDAY_ZH[dayOfWeek - 1];

// The same date line the home agenda section renders (home.tsx), so the card
// header reads like the app instead of "09-20 日".
const DAY_ZH = [
	"",
	"星期一",
	"星期二",
	"星期三",
	"星期四",
	"星期五",
	"星期六",
	"星期天",
];
const DAY_EN = ["", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat.", "Sun."];

const dateText = (language: "zh" | "en", d: Dayjs): string => {
	const dayOfWeek = d.day() === 0 ? 7 : d.day();
	return language === "zh"
		? `${d.month() + 1}月${d.date()}日 ${DAY_ZH[dayOfWeek]}`
		: `${DAY_EN[dayOfWeek]} ${d.month() + 1}/${d.date()}`;
};

interface WidgetLayoutEntry extends ScheduleLayoutEntry {
	schedule: StoredSchedule;
	slice: TimeSlice;
	item: WidgetScheduleItem;
}

const clamp = (value: number, low: number, high: number) =>
	Math.max(low, Math.min(value, high));

const widgetColor = (schedule: StoredSchedule, colorList: string[]): string => {
	return colorList[
		parseInt(md5(schedule.name).substr(0, 6), 16) % colorList.length
	];
};

const withAlpha = (color: string, alpha: string): string =>
	color.startsWith("#") && color.length === 7
		? `#${alpha}${color.slice(1)}`
		: color;

const displayStartMinute = (
	schedules: StoredSchedule[],
	firstDay: string,
	weekCount: number,
): number => {
	let earliest: number | undefined;
	for (const schedule of schedules) {
		for (const slice of schedule.activeTime.base) {
			const week = getWeekFromTime(slice.beginTime, firstDay);
			if (week < 1 || week > weekCount) {
				continue;
			}
			const minute = slice.beginTime.hour() * 60 + slice.beginTime.minute();
			if (earliest === undefined || minute < earliest) {
				earliest = minute;
			}
		}
	}
	return Math.floor(Math.min(earliest ?? 8 * 60, 8 * 60) / 60) * 60;
};

const normalizeWeekLayout = (
	entries: WidgetLayoutEntry[],
	classPeriods: boolean,
	startMinute: number,
): Pick<WidgetWeekView, "rows" | "blocks"> => {
	if (entries.length === 0) {
		return {rows: [], blocks: []};
	}
	const layout = buildScheduleLayout(entries, {
		classPeriods,
		periodHeight: 45,
		cardMinHeight: 52,
		minuteHeight: 1,
		startMinute,
	});
	if (layout.blocks.length === 0) {
		return {rows: [], blocks: []};
	}

	let cropTop = Math.min(...layout.blocks.map((block) => block.top));
	let cropBottom = Math.max(
		...layout.blocks.map((block) => block.top + block.height),
	);
	// Keep the complete app row containing the first/last item. This removes
	// only leading/trailing empty time while preserving gaps and relative time.
	for (const row of layout.rows) {
		if (
			row.height > 0 &&
			row.top < cropBottom &&
			row.top + row.height > cropTop
		) {
			cropTop = Math.min(cropTop, row.top);
			cropBottom = Math.max(cropBottom, row.top + row.height);
		}
	}
	const range = Math.max(1, cropBottom - cropTop);
	const normalizeTop = (top: number) => clamp((top - cropTop) / range, 0, 1);
	const normalizeHeight = (top: number, height: number) => {
		const normalizedTop = normalizeTop(top);
		const normalizedBottom = clamp((top + height - cropTop) / range, 0, 1);
		return Math.max(0, normalizedBottom - normalizedTop);
	};

	return {
		rows: layout.rows
			.filter((row) => row.top <= cropBottom && row.top + row.height >= cropTop)
			.map((row) => ({
				kind: row.kind,
				period: row.period,
				begin: formatScheduleMinute(row.begin),
				end: formatScheduleMinute(row.end),
				top: normalizeTop(row.top),
				height: normalizeHeight(row.top, row.height),
			})),
		blocks: layout.blocks.map((block) => ({
			...block.entry.item,
			dayOfWeek: block.entry.slice.dayOfWeek,
			top: normalizeTop(block.top),
			height: normalizeHeight(block.top, block.height),
			timeLabel: block.timeLabel ?? "",
			compact: block.compact ?? false,
			fill: block.entry.item.color,
			textColor: "#FFFFFFFF",
		})),
	};
};

const buildWeekView = (
	state: State,
	now: Dayjs,
	colorList: string[],
): WidgetWeekView => {
	const {firstDay, weekCount, language} = state.config;
	const lang = resolveLanguage(language);
	const rawWeek = getWeekFromTime(now, firstDay);
	const week = weekCount > 0 ? clamp(rawWeek, 1, weekCount) : rawWeek;
	const monday = dayjs(firstDay).add((week - 1) * 7, "day");
	const showOfficial = state.config.showOfficialSchedule ?? true;
	const showCustom = state.config.showCustomSchedule ?? true;
	const schedules = state.schedule.baseSchedule.filter((schedule) =>
		schedule.type === ScheduleType.CUSTOM ? showCustom : showOfficial,
	);
	const ctx = {
		firstDay,
		weekCount,
		shortenMap: state.schedule.shortenMap,
		colorList,
	};
	const allDays = Array.from({length: 7}, (_, index): WidgetDay => {
		const date = monday.add(index, "day");
		const dayOfWeek = index + 1;
		return {
			dayOfWeek,
			date: date.format("MM-DD"),
			label: weekdayLabel(lang, dayOfWeek),
			dateText: dateText(lang, date),
			items: selectDaySchedule(schedules, dayOfWeek, date, ctx).map(
				toWidgetItem,
			),
		};
	});
	const weekendHasItems =
		allDays[5].items.length > 0 || allDays[6].items.length > 0;
	const showWeekend = !(state.config.hideWeekend ?? false) && weekendHasItems;
	const days = showWeekend ? allDays : allDays.slice(0, 5);
	const enableNewUI = state.config.scheduleEnableNewUI ?? true;
	const entries: WidgetLayoutEntry[] = [];
	for (const schedule of schedules) {
		const color = widgetColor(schedule, colorList);
		for (const slice of schedule.activeTime.base) {
			if (
				getWeekFromTime(slice.beginTime, firstDay) !== week ||
				(!showWeekend && slice.dayOfWeek > 5)
			) {
				continue;
			}
			entries.push({
				schedule,
				slice,
				item: {
					name: state.schedule.shortenMap[schedule.localId] ?? schedule.name,
					loc: schedule.location,
					from: slice.beginTime.format("HH:mm"),
					to: slice.endTime.format("HH:mm"),
					begin: slice.beginTime.valueOf(),
					end: slice.endTime.valueOf(),
					color,
				},
			});
		}
	}
	const classPeriods = state.config.scheduleUseClassPeriods ?? true;
	const normalized = normalizeWeekLayout(
		entries,
		classPeriods,
		displayStartMinute(schedules, firstDay, weekCount),
	);
	if (enableNewUI) {
		normalized.blocks = normalized.blocks.map((block) => ({
			...block,
			fill: withAlpha(block.color, "44"),
			textColor: block.color,
		}));
	}
	return {
		week,
		days,
		rows: normalized.rows,
		blocks: normalized.blocks,
		classPeriods,
		showWeekend,
		showAxisTimes: (state.config.scheduleHeightMode ?? 10) > 1,
	};
};

export const buildScheduleSnapshot = (state: State): WidgetSnapshot => {
	const now = dayjs();
	const {firstDay, weekCount, language} = state.config;
	const lang = resolveLanguage(language);
	// The palette is identical across light and dark themes.
	const colorList = themes("light").colors.courseItemColorList;
	const ctx = {
		firstDay,
		weekCount,
		shortenMap: state.schedule.shortenMap,
		colorList,
	};
	const dayOf = (d: Dayjs): WidgetDay => {
		const dayOfWeek = d.day() === 0 ? 7 : d.day();
		return {
			dayOfWeek,
			date: d.format("MM-DD"),
			label: weekdayLabel(lang, dayOfWeek),
			dateText: dateText(lang, d),
			items: selectDaySchedule(
				state.schedule.baseSchedule,
				dayOfWeek,
				d,
				ctx,
			).map(toWidgetItem),
		};
	};
	const nextDays = [0, 1, 2, 3, 4, 5, 6].map((offset) =>
		dayOf(now.add(offset, "day")),
	);
	return {
		v: 1,
		generatedAt: now.valueOf(),
		week: getWeekFromTime(now, firstDay),
		language: lang,
		today: nextDays[0],
		tomorrow: nextDays[1],
		nextDays,
		weekView: buildWeekView(state, now, colorList),
		empty: state.schedule.baseSchedule.length === 0,
	};
};

// The harmony and Android builds resolve this through the RTNWidget module;
// other platforms (and dev environments without the module) silently skip syncing.
const RTNWidget: import("rtn-widget/src/specs/v2/NativeWidget").Spec | null =
	// @ts-ignore -- "harmony" exists only in the RNOH-patched Platform types.
	Platform.OS === "harmony" || Platform.OS === "android"
		? (() => {
				try {
					return require("rtn-widget").RTNWidget;
				} catch {
					return null;
				}
			})()
		: null;

const PUSH_THROTTLE_MS = 5000;
let lastPush = 0;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

const pushSnapshot = async () => {
	if (!RTNWidget) {
		return;
	}
	// Before redux-persist rehydrates, the store holds no schedule — pushing
	// would briefly clobber the cards with an empty snapshot.
	if (!persistor.getState().bootstrapped) {
		return;
	}
	try {
		await RTNWidget.updateScheduleSnapshot(
			JSON.stringify(buildScheduleSnapshot(store.getState())),
		);
		lastPush = Date.now();
	} catch (e) {
		console.warn("schedule widget sync failed", e);
	}
};

const schedulePush = () => {
	if (!RTNWidget) {
		return;
	}
	const elapsed = Date.now() - lastPush;
	if (elapsed >= PUSH_THROTTLE_MS) {
		pushSnapshot().catch(() => {});
		return;
	}
	if (pendingTimer === null) {
		pendingTimer = setTimeout(() => {
			pendingTimer = null;
			pushSnapshot().catch(() => {});
		}, PUSH_THROTTLE_MS - elapsed);
	}
};

// The navigator may not be mounted yet during a cold start launched from a
// card tap; retry briefly instead of dropping the navigation.
const navigateWhenReady = () => {
	let attempts = 0;
	const attempt = () => {
		if (navigationRef.isReady()) {
			navigationRef.navigate("ScheduleTab");
		} else if (++attempts < 50) {
			setTimeout(attempt, 100);
		}
	};
	attempt();
};

const consumeLaunchParams = async () => {
	if (!RTNWidget) {
		return;
	}
	try {
		const raw = await RTNWidget.consumeLaunchParams();
		if (!raw) {
			return;
		}
		const params = JSON.parse(raw);
		if (params?.target === "schedule") {
			navigateWhenReady();
		}
	} catch (e) {
		console.warn("schedule widget launch failed", e);
	}
};

const relevant = (s: State) => ({
	baseSchedule: s.schedule.baseSchedule,
	shortenMap: s.schedule.shortenMap,
	firstDay: s.config.firstDay,
	weekCount: s.config.weekCount,
	semesterId: s.schedule.semesterId,
	language: s.config.language,
	hideWeekend: s.config.hideWeekend,
	scheduleUseClassPeriods: s.config.scheduleUseClassPeriods,
	scheduleHeightMode: s.config.scheduleHeightMode,
	scheduleEnableNewUI: s.config.scheduleEnableNewUI,
	showOfficialSchedule: s.config.showOfficialSchedule,
	showCustomSchedule: s.config.showCustomSchedule,
});

let initialized = false;

export const initWidgetSync = () => {
	// @ts-ignore -- "harmony" exists only in the RNOH-patched Platform types.
	if (initialized || (Platform.OS !== "harmony" && Platform.OS !== "android")) {
		return;
	}
	initialized = true;

	let last = relevant(store.getState());
	store.subscribe(() => {
		const next = relevant(store.getState());
		if (
			next.baseSchedule !== last.baseSchedule ||
			next.shortenMap !== last.shortenMap ||
			next.firstDay !== last.firstDay ||
			next.weekCount !== last.weekCount ||
			next.semesterId !== last.semesterId ||
			next.language !== last.language ||
			next.hideWeekend !== last.hideWeekend ||
			next.scheduleUseClassPeriods !== last.scheduleUseClassPeriods ||
			next.scheduleHeightMode !== last.scheduleHeightMode ||
			next.scheduleEnableNewUI !== last.scheduleEnableNewUI ||
			next.showOfficialSchedule !== last.showOfficialSchedule ||
			next.showCustomSchedule !== last.showCustomSchedule
		) {
			last = next;
			schedulePush();
		}
	});

	AppState.addEventListener("change", (state) => {
		if (state === "active") {
			pushSnapshot().catch(() => {});
			consumeLaunchParams().catch(() => {});
		}
	});

	// The bootstrapped guard in pushSnapshot drops the REHYDRATE-triggered
	// push (redux-persist flips bootstrapped after dispatching REHYDRATE), so
	// retry once rehydration has actually completed.
	const stopPersistorListener = persistor.subscribe(() => {
		if (persistor.getState().bootstrapped) {
			stopPersistorListener();
			pushSnapshot().catch(() => {});
		}
	});

	// Card taps while the app is already foreground (split-screen) never fire
	// an AppState change; EntryAbility emits this device event instead.
	DeviceEventEmitter.addListener("widgetLaunch", () => {
		consumeLaunchParams().catch(() => {});
	});

	pushSnapshot().catch(() => {});
	consumeLaunchParams().catch(() => {});
};
