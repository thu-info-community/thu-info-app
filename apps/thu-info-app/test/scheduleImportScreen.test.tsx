import React from "react";
import {Alert} from "react-native";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import dayjs from "dayjs";
import {ScheduleImportScreen} from "../src/ui/schedule/scheduleImport";
import {scheduleReducer, scheduleFetch} from "../src/redux/slices/schedule";
import {ScheduleType} from "@thu-info/lib/src/models/schedule/schedule";
import {pickScheduleFile} from "../src/utils/pickScheduleFile";
import {currState, helper} from "../src/redux/store";
import zh from "../src/assets/translations/zh";

jest.mock("../src/redux/store", () => ({
	currState: jest.fn(),
	helper: {getSchedule: jest.fn()},
}));
jest.mock("../src/utils/pickScheduleFile", () => ({
	pickScheduleFile: jest.fn(),
}));
jest.mock("../src/utils/i18n", () => ({
	getStr: (key: keyof typeof zh) =>
		require("../src/assets/translations/zh").default[key],
}));

const ics =
	"BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:weekend\r\nSUMMARY:Weekend reading\r\nDTSTART:20260704T091500\r\nDTEND:20260704T094000\r\nEND:VEVENT\r\nEND:VCALENDAR";
const official = {
	name: "Old official",
	location: "Room 1",
	type: ScheduleType.PRIMARY,
	hash: "old",
	delOrHideTime: {base: []},
	activeTime: {
		base: [
			{
				dayOfWeek: 6,
				beginTime: dayjs("2026-07-04T09:15:00"),
				endTime: dayjs("2026-07-04T10:10:00"),
			},
		],
	},
};

async function setup() {
	const store = configureStore({
		reducer: {
			schedule: scheduleReducer,
			config: () => ({
				firstDay: "2026-07-01",
				weekCount: 4,
				nextSemesterIndex: undefined,
			}),
		},
		middleware: (getDefault) => getDefault({serializableCheck: false}),
	});
	jest
		.mocked(currState)
		.mockImplementation(() => store.getState() as ReturnType<typeof currState>);
	jest
		.mocked(pickScheduleFile)
		.mockResolvedValue({name: "weekend.ics", text: ics});
	store.dispatch(scheduleFetch({schedule: [official], semesterId: "summer"}));
	const navigation = {goBack: jest.fn()} as never;
	await render(
		<Provider store={store}>
			<ScheduleImportScreen navigation={navigation} />
		</Provider>,
	);
	return store;
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

it("lets students preview and append an exact-time weekend plan", async () => {
	const store = await setup();
	await fireEvent.press(screen.getByText(zh.scheduleImportChoose));
	await screen.findByText("☑ Weekend reading");
	expect(store.getState().schedule.baseSchedule).toHaveLength(1);
	await fireEvent.press(screen.getByText(zh.scheduleImportConfirm));
	const confirm = jest.mocked(Alert.alert).mock.calls.at(-1)![2]![1];
	await act(async () => {
		confirm.onPress!();
	});
	expect(
		store
			.getState()
			.schedule.baseSchedule.find((s) => s.type === ScheduleType.CUSTOM)
			?.activeTime.base[0].endTime.format("HH:mm"),
	).toBe("09:40");
	expect(
		store.getState().schedule.baseSchedule[0].activeTime.base,
	).toHaveLength(1);
});

it("previews affected official events and requires confirmation before replacement", async () => {
	const store = await setup();
	await fireEvent.press(screen.getByText(zh.scheduleImportReplace));
	await fireEvent.press(screen.getByText(zh.scheduleImportChoose));
	await screen.findByText(zh.scheduleImportAffected);
	await fireEvent.press(screen.getByText(zh.scheduleImportConfirm));
	expect(jest.mocked(Alert.alert).mock.calls.at(-1)![1]).toContain(
		"被覆盖的本地安排不能自动恢复",
	);
	expect(
		store.getState().schedule.baseSchedule[0].activeTime.base,
	).toHaveLength(1);
	await act(async () => {
		jest.mocked(Alert.alert).mock.calls.at(-1)![2]![1].onPress!();
	});
	expect(
		store.getState().schedule.baseSchedule[0].activeTime.base,
	).toHaveLength(0);
	expect(store.getState().schedule.replacementRanges).toHaveLength(1);
});

it("leaves data unchanged when the file picker is cancelled", async () => {
	const store = await setup();
	jest.mocked(pickScheduleFile).mockResolvedValue(null);
	const before = store.getState().schedule;
	await fireEvent.press(screen.getByText(zh.scheduleImportChoose));
	await waitFor(() =>
		expect(screen.queryByLabelText(zh.scheduleImportLoading)).toBeNull(),
	);
	expect(store.getState().schedule).toBe(before);
	expect(screen.queryByText(zh.scheduleImportConfirm)).toBeNull();
});

it("invalidates the preview after a date edit and supports deselecting an event", async () => {
	await setup();
	await fireEvent.press(screen.getByText(zh.scheduleImportChoose));
	await screen.findByText("☑ Weekend reading");
	await fireEvent.press(screen.getByText("☑ Weekend reading"));
	expect(screen.getByText("☐ Weekend reading")).toBeTruthy();
	await fireEvent.changeText(
		screen.getByLabelText(zh.scheduleImportEnd),
		"2026-02-30",
	);
	expect(screen.queryByText(zh.scheduleImportConfirm)).toBeNull();
	expect(screen.getByText(zh.scheduleImportRangeError)).toBeTruthy();
});

it("preserves replacement suppression if restoring the official schedule fails", async () => {
	const store = await setup();
	await fireEvent.press(screen.getByText(zh.scheduleImportReplace));
	await fireEvent.press(screen.getByText(zh.scheduleImportChoose));
	await screen.findByText("☑ Weekend reading");
	await fireEvent.press(screen.getByText(zh.scheduleImportConfirm));
	await act(async () => {
		jest.mocked(Alert.alert).mock.calls.at(-1)![2]![1].onPress!();
	});
	jest.mocked(helper.getSchedule).mockRejectedValue(new Error("offline"));
	await fireEvent.press(screen.getByText(zh.scheduleImportRestore));
	await act(async () => {
		await jest.mocked(Alert.alert).mock.calls.at(-1)![2]![1].onPress!();
	});
	expect(store.getState().schedule.replacementRanges).toHaveLength(1);
	expect(screen.getByText(zh.networkRetry)).toBeTruthy();
});
