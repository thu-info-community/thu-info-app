import {afterEach, expect, jest, test} from "@jest/globals";
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react-native";
import {Alert} from "react-native";
import {PasskeySettings} from "../src/components/settings/passkeySettings";
import type {RootNav} from "../src/components/Root";
import {disablePasskey} from "../src/utils/passkey";

let mockState = {
	auth: {userId: "2026000000", passkeys: {"2026000000": {name: "THU Info APP (Pixel 9)", protectionLevel: "unknown"}}},
	config: {language: "zh"},
};
jest.mock("react-redux", () => ({useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState)}));
jest.mock("../src/redux/store", () => ({currState: () => ({config: {language: "zh"}})}));
jest.mock("../src/utils/passkeyNative", () => ({passkeyAvailable: true}));
jest.mock("../src/utils/passkey", () => ({enablePasskey: jest.fn(), disablePasskey: jest.fn()}));
jest.mock("../src/ui/settings/settings", () => ({styles: () => ({})}));
const navigation = {navigate: jest.fn()} as unknown as RootNav;
afterEach(async () => { await cleanup(); jest.clearAllMocks(); });

test("uses a device name and plain unknown text for an unconfirmed protection level", async () => {
	await render(<PasskeySettings navigation={navigation} />);
	expect(screen.getByText("THU Info APP (Pixel 9)")).toBeTruthy();
	expect(screen.getByText("未知")).toBeTruthy();
	expect(screen.getByText("已设置")).toBeTruthy();
});

test("the logged-out entry routes to login without starting enrollment", async () => {
	mockState.auth.userId = "";
	try {
		await render(<PasskeySettings navigation={navigation} />);
		expect(screen.getByText("已设置")).toBeTruthy();
		await fireEvent.press(screen.getByTestId("passkeySettings"));
		expect(navigation.navigate).toHaveBeenCalledWith("Login");
	} finally { mockState.auth.userId = "2026000000"; }
});

test("canceling the app confirmation leaves the Passkey intact", async () => {
	const alert = jest.spyOn(Alert, "alert");
	try {
		await render(<PasskeySettings navigation={navigation} />);
		await fireEvent.press(screen.getByTestId("passkeySettings"));
		expect(await screen.findByText("删除后，此设备需要使用学校密码登录。")).toBeTruthy();
		await fireEvent.press(screen.getByText("取消"));
		await waitFor(() => expect(screen.queryByText("删除后，此设备需要使用学校密码登录。")).toBeNull());
		expect(disablePasskey).not.toHaveBeenCalled();
		expect(alert).not.toHaveBeenCalled();
	} finally { alert.mockRestore(); }
});

test("a deletion failure appears inside the app and keeps the configured state", async () => {
	const alert = jest.spyOn(Alert, "alert");
	jest.mocked(disablePasskey).mockRejectedValueOnce(new Error("offline"));
	try {
		await render(<PasskeySettings navigation={navigation} />);
		await fireEvent.press(screen.getByTestId("passkeySettings"));
		await screen.findByText("删除后，此设备需要使用学校密码登录。");
		await fireEvent.press(screen.getByText("删除"));
		expect(await screen.findByText("未能删除，请检查网络后重试。")).toBeTruthy();
		expect(screen.getByText("已设置")).toBeTruthy();
		expect(alert).not.toHaveBeenCalled();
	} finally { alert.mockRestore(); }
});
