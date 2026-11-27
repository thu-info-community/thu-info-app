import {afterEach, expect, jest, test} from "@jest/globals";
import {waitFor} from "@testing-library/react-native";
import {Alert, Linking, Platform} from "react-native";
import {helper, store} from "../src/redux/store";
import {configSet} from "../src/redux/slices/config";
import {checkUpdate} from "../src/utils/checkUpdate";

jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {doNotRemindSemver: "0.0.0"}}),
	helper: {getLatestVersion: jest.fn()},
	store: {dispatch: jest.fn()},
}));
jest.mock("../src/utils/i18n", () => ({getStr: (key: string) => key}));

afterEach(() => {
	jest.restoreAllMocks();
	jest.clearAllMocks();
});

test("Android manual check offers skipping the version and downloading the APK", async () => {
	jest.replaceProperty(Platform, "OS", "android");
	const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
	const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
	const version = {
		versionName: "9.0.0",
		releaseNote: "Release notes",
		downloadUrl: "https://app.cs.tsinghua.edu.cn/apk/THUInfo_release_v9.0.0.apk",
	};
	jest.mocked(helper.getLatestVersion).mockResolvedValue(version);

	checkUpdate(true);

	await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
	expect(helper.getLatestVersion).toHaveBeenCalledWith("android");
	const buttons = alert.mock.calls[0][2] ?? [];
	expect(buttons.map(({text}) => text)).toEqual(["ignoreThisVersion", "download"]);
	buttons[0].onPress?.();
	buttons[1].onPress?.();
	expect(store.dispatch).toHaveBeenCalledWith(
		configSet({key: "doNotRemindSemver", value: version.versionName}),
	);
	expect(openURL).toHaveBeenCalledWith(version.downloadUrl);
});

test.each(["ios", "harmony"])("%s manual entry does not check for an update", (platform) => {
	jest.replaceProperty(Platform, "OS", platform as typeof Platform.OS);

	checkUpdate(true);

	expect(helper.getLatestVersion).not.toHaveBeenCalled();
});
