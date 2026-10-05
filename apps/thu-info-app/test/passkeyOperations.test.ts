import {beforeEach, expect, jest, test} from "@jest/globals";
import type {PasskeyCredential} from "@thu-info/lib";
import {PasskeyError} from "@thu-info/lib/src/utils/error";
import {getCsrfToken, roam} from "@thu-info/lib/src/lib/core";
import {enablePasskey} from "../src/utils/passkey";
import {helper, persistor, store} from "../src/redux/store";
import {authReducer, defaultAuth, loginWithPasskey} from "../src/redux/slices/auth";
import type {AuthState} from "../src/redux/slices/auth";
import type {Dispatch, UnknownAction} from "redux";

let mockState: {auth: AuthState};
jest.mock("@thu-info/lib/src/lib/core", () => ({roam: jest.fn(), getCsrfToken: jest.fn()}));
jest.mock("../src/redux/store", () => ({
	currState: () => mockState,
	store: {dispatch: jest.fn()},
	persistor: {flush: jest.fn()},
	helper: {
		userId: "2026000000", password: "", passkeyCredential: undefined,
		hasAuthentication: jest.fn(), login: jest.fn(), preparePasskey: jest.fn(),
		listPasskeys: jest.fn(), registerPasskey: jest.fn(), renamePasskey: jest.fn(), removePasskey: jest.fn(),
		trustFingerprintNameHook: jest.fn(), getUserInfo: jest.fn(), getCalendar: jest.fn(),
		passkeyAuthenticator: {getCredential: jest.fn(), deleteCredential: jest.fn()},
	},
}));
const old: PasskeyCredential = {
	userId: "2026000000", userHandle: "handle", rpId: "tsinghua.edu.cn", name: "THU Info APP (Demo phone)",
	keyId: "old-key", credentialId: "old-credential", publicKeyX: "x", publicKeyY: "y", protectionLevel: "unknown", authenticationMode: "silent",
};
const replacement = (authenticationMode: "required" | "silent"): PasskeyCredential => ({
	...old, keyId: "new-key", credentialId: "new-credential", authenticationMode,
});
beforeEach(() => {
	jest.resetAllMocks();
	jest.mocked(store.dispatch as Dispatch<UnknownAction>).mockImplementation((action) => {
		mockState = {auth: authReducer(mockState.auth, action)};
		return action;
	});
	mockState = {auth: authReducer({...defaultAuth}, loginWithPasskey(old))};
	helper.userId = old.userId;
	helper.password = "";
	helper.passkeyCredential = old;
	jest.mocked(helper.hasAuthentication).mockReturnValue(true);
	jest.mocked(helper.preparePasskey).mockImplementation(async (options) => replacement(options?.authenticationMode ?? "required"));
	jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValue(replacement("required"));
	jest.mocked(helper.listPasskeys).mockResolvedValue([{credentialId: old.credentialId}, {credentialId: "other-device-credential"}]);
	jest.mocked(helper.getUserInfo).mockResolvedValue({userId: old.userId} as Awaited<ReturnType<typeof helper.getUserInfo>>);
});
test("replaces a silent key only after verified login, portal bootstrap and persistence", async () => {
	await expect(enablePasskey("required")).resolves.toEqual(replacement("required"));
	expect(helper.preparePasskey).toHaveBeenCalledWith({authenticationMode: "required"});
	expect(helper.login).toHaveBeenCalledWith({method: "passkey", credential: replacement("required")});
	expect(getCsrfToken).toHaveBeenCalledTimes(1);
	expect(helper.getCalendar).toHaveBeenCalledTimes(1);
	expect(mockState.auth.passkeys[old.userId]).toEqual(replacement("required"));
	expect(mockState.auth.silentPasskeyLogin[old.userId]).toBe(false);
	expect(mockState.auth.password).toBe("");
	expect(helper.removePasskey).toHaveBeenCalledWith(old);
	expect(helper.removePasskey).toHaveBeenCalledTimes(1);
	expect(helper.passkeyAuthenticator!.deleteCredential).toHaveBeenCalledWith(old.keyId);
	expect(persistor.flush).toHaveBeenCalled();
});
test("canceling replacement retains the old key and pending recovery metadata without a second prompt", async () => {
	jest.mocked(helper.login).mockRejectedValueOnce(new PasskeyError("canceled", "登录已取消。"));
	await expect(enablePasskey("required")).rejects.toMatchObject({code: "canceled"});
	expect(mockState.auth.passkeys[old.userId]).toEqual(old);
	expect(mockState.auth.silentPasskeyLogin[old.userId]).toBe(true);
	expect(mockState.auth.pendingPasskey).toEqual(replacement("required"));
	expect(helper.passkeyCredential).toEqual(old);
	expect(helper.login).toHaveBeenCalledTimes(1);
	expect(helper.removePasskey).not.toHaveBeenCalled();
});
test("a failed portal bootstrap removes only the attempted key and retains the old mode", async () => {
	jest.mocked(getCsrfToken).mockRejectedValueOnce(new Error("portal unavailable"));
	jest.mocked(helper.listPasskeys).mockResolvedValue([{credentialId: old.credentialId}, {credentialId: "new-credential"}, {credentialId: "other-device-credential"}]);
	await expect(enablePasskey("required")).rejects.toThrow("portal unavailable");
	expect(mockState.auth.passkeys[old.userId]).toEqual(old);
	expect(mockState.auth.silentPasskeyLogin[old.userId]).toBe(true);
	expect(helper.removePasskey).toHaveBeenCalledWith(replacement("required"));
	expect(helper.removePasskey).toHaveBeenCalledTimes(1);
	expect(mockState.auth.pendingPasskey).toBeUndefined();
});
test("an interrupted key with a different policy is removed by ID before creating the requested key", async () => {
	const pending = {...old, keyId: "pending-key", credentialId: "pending-credential", authenticationMode: "silent" as const};
	mockState.auth = {...mockState.auth, pendingPasskey: pending};
	jest.mocked(helper.listPasskeys).mockResolvedValue([{credentialId: old.credentialId}, {credentialId: pending.credentialId}, {credentialId: "other-device-credential"}]);
	await enablePasskey("required");
	expect(helper.removePasskey).toHaveBeenNthCalledWith(1, pending);
	expect(helper.removePasskey).toHaveBeenNthCalledWith(2, old);
	expect(helper.passkeyAuthenticator!.deleteCredential).toHaveBeenNthCalledWith(1, pending.keyId);
	expect(helper.preparePasskey).toHaveBeenCalledWith({authenticationMode: "required"});
});
test.each([false, true])("a new account uses its silent preference %s, otherwise verification is required", async (silent) => {
	mockState.auth = {...defaultAuth, userId: old.userId, password: "synthetic-password", passkeys: {}, silentPasskeyLogin: {[old.userId]: silent}};
	helper.passkeyCredential = undefined;
	const mode = silent ? "silent" : "required";
	jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValue(replacement(mode));
	await enablePasskey();
	expect(helper.preparePasskey).toHaveBeenCalledWith({authenticationMode: mode});
	expect(mockState.auth.password).toBe("");
});
test("logging out during replacement does not reactivate an account or trigger rollback login", async () => {
	jest.mocked(helper.getCalendar).mockImplementationOnce(async () => {
		mockState = {auth: {...mockState.auth, userId: "", authMethod: "password"}};
		return {} as Awaited<ReturnType<typeof helper.getCalendar>>;
	});
	await expect(enablePasskey("required")).rejects.toMatchObject({code: "canceled"});
	expect(mockState.auth.userId).toBe("");
	expect(mockState.auth.passkeys[old.userId]).toEqual(old);
	expect(helper.login).toHaveBeenCalledTimes(1);
	expect(store.dispatch).not.toHaveBeenCalledWith(loginWithPasskey(replacement("required")));
});

test("a pending operation rejects duplicates and releases the guard after failure and success", async () => {
	let cancel!: (error: PasskeyError) => void;
	jest.mocked(roam).mockImplementationOnce(() => new Promise<string>((_resolve, reject) => { cancel = reject; }));
	const first = enablePasskey("required");
	const failed = expect(first).rejects.toMatchObject({code: "canceled"});
	expect(() => enablePasskey("required")).toThrow("正在设置，请稍候。");
	cancel(new PasskeyError("canceled", "登录已取消。"));
	await failed;
	await expect(enablePasskey("required")).resolves.toEqual(replacement("required"));
	await expect(enablePasskey("required")).resolves.toEqual(replacement("required"));
});
