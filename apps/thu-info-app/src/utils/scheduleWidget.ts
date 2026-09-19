import dayjs, {Dayjs} from "dayjs";
import {AppState, DeviceEventEmitter, Platform} from "react-native";
import {getWeekFromTime} from "@thu-info/lib/src/models/schedule/schedule";
import themes from "../assets/themes/themes";
import {navigationRef, persistor, State, store} from "../redux/store";
import {DayScheduleItem, selectDaySchedule} from "./scheduleQuery";

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
	items: WidgetScheduleItem[];
}

export interface WidgetSnapshot {
	v: 1;
	generatedAt: number;
	week: number;
	today: WidgetDay;
	tomorrow: WidgetDay;
	// Seven consecutive days starting today; the week card and the
	// "next item" fallback both read from this list.
	nextDays: WidgetDay[];
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

const weekdayLabel = (language: string, dayOfWeek: number): string => {
	if (language === "en") {
		return WEEKDAY_EN[dayOfWeek - 1];
	}
	if (language !== "zh") {
		try {
			// Lazily required: unavailable in some environments (e.g. tests).
			const {getLocales} = require("react-native-localize");
			if (!getLocales()[0]?.languageTag.startsWith("zh")) {
				return WEEKDAY_EN[dayOfWeek - 1];
			}
		} catch {
			// Fall back to Chinese below.
		}
	}
	return WEEKDAY_ZH[dayOfWeek - 1];
};

export const buildScheduleSnapshot = (state: State): WidgetSnapshot => {
	const now = dayjs();
	const {firstDay, weekCount, language} = state.config;
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
			label: weekdayLabel(language, dayOfWeek),
			items: selectDaySchedule(state.schedule.baseSchedule, dayOfWeek, d, ctx).map(
				toWidgetItem,
			),
		};
	};
	const nextDays = [0, 1, 2, 3, 4, 5, 6].map((offset) => dayOf(now.add(offset, "day")));
	return {
		v: 1,
		generatedAt: now.valueOf(),
		week: getWeekFromTime(now, firstDay),
		today: nextDays[0],
		tomorrow: nextDays[1],
		nextDays,
		empty: state.schedule.baseSchedule.length === 0,
	};
};

// The harmony build resolves this through the RTNWidget turbo module; other
// platforms (and dev environments without the module) silently skip syncing.
const RTNWidget: import("rtn-widget/src/specs/v2/NativeWidget").Spec | null =
	// @ts-ignore -- "harmony" exists only in the RNOH-patched Platform types.
	Platform.OS === "harmony"
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
		pendingTimer = setTimeout(
			() => {
				pendingTimer = null;
				pushSnapshot().catch(() => {});
			},
			PUSH_THROTTLE_MS - elapsed,
		);
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
});

let initialized = false;

export const initWidgetSync = () => {
	// @ts-ignore -- "harmony" exists only in the RNOH-patched Platform types.
	if (initialized || Platform.OS !== "harmony") {
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
			next.language !== last.language
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
