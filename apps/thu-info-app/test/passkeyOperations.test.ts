import {beforeEach, expect, jest, test} from "@jest/globals";
import type {PasskeyCredential} from "@thu-info/lib";
import {PasskeyError} from "@thu-info/lib/src/utils/error";
import {getCsrfToken, roam} from "@thu-info/lib/src/lib/core";
import {enablePasskey, migratePasskey} from "../src/utils/passkey";
import {helper, persistor, store} from "../src/redux/store";
import {authReducer, defaultAuth, loginWithPasskey} from "../src/redux/slices/auth";
import type {AuthState} from "../src/redux/slices/auth";
import type {Dispatch, UnknownAction} from "redux";
import {getPasskeyCapabilities} from "../src/utils/passkeyNative";

let mockState: {auth: AuthState};
jest.mock("@thu-info/lib/src/lib/core", () => ({roam: jest.fn(), getCsrfToken: jest.fn()}));
jest.mock("../src/utils/passkeyNative", () => ({getPasskeyCapabilities: jest.fn()}));
jest.mock("../src/redux/store", () => ({
	currState: () => mockState,
	store: {dispatch: jest.fn()},
	persistor: {flush: jest.fn()},
	helper: {
		userId: "2026000000", password: "", passkeyCredential: undefined,
		hasAuthentication: jest.fn(), login: jest.fn(), preparePasskey: jest.fn(),
		loginForPasskeyMigration: jest.fn(),
		listPasskeys: jest.fn(), registerPasskey: jest.fn(), renamePasskey: jest.fn(), removePasskey: jest.fn(),
		trustFingerprintNameHook: jest.fn(), getUserInfo: jest.fn(), getCalendar: jest.fn(),
		passkeyAuthenticator: {getCredential: jest.fn(), deleteCredential: jest.fn()},
	},
}));
const old: PasskeyCredential = {
	userId: "2026000000", userHandle: "handle", rpId: "id.tsinghua.edu.cn", name: "THU Info APP (Demo phone)",
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
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({rootHint: false, verificationAvailability: "available"});
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

const useNewAccount = () => {
	mockState.auth = {...defaultAuth, userId: old.userId, password: "synthetic-password"};
	helper.passkeyCredential = undefined;
	helper.password = mockState.auth.password;
};

test.each(["available", "unknown", "not-configured", "unsupported"] as const)("default setup chooses the native policy for capability %s and persists the actual mode", async (availability) => {
	useNewAccount();
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({rootHint: false, verificationAvailability: availability});
	const mode = availability === "available" || availability === "unknown" ? "required" : "silent";
	jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValue(replacement(mode));
	await expect(enablePasskey()).resolves.toEqual(replacement(mode));
	expect(helper.preparePasskey).toHaveBeenCalledTimes(1);
	expect(helper.preparePasskey).toHaveBeenCalledWith({authenticationMode: mode});
	expect(mockState.auth.passkeys[old.userId].authenticationMode).toBe(mode);
	expect(mockState.auth.silentPasskeyLogin[old.userId]).toBe(mode === "silent");
});

test("default setup falls back once when native key creation cannot support verification", async () => {
	useNewAccount();
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({rootHint: false, verificationAvailability: "unknown"});
	jest.mocked(helper.preparePasskey).mockRejectedValueOnce(new PasskeyError("verification-unavailable", "unavailable"));
	jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValue(replacement("silent"));
	await expect(enablePasskey()).resolves.toEqual(replacement("silent"));
	expect(helper.preparePasskey).toHaveBeenNthCalledWith(1, {authenticationMode: "required"});
	expect(helper.preparePasskey).toHaveBeenNthCalledWith(2, {authenticationMode: "silent"});
	expect(helper.preparePasskey).toHaveBeenCalledTimes(2);
	expect(mockState.auth.silentPasskeyLogin[old.userId]).toBe(true);
});

test.each(["canceled", "locked", "interaction-required", "unavailable"])("default setup does not fall back when key creation fails with %s", async (code) => {
	useNewAccount();
	jest.mocked(helper.preparePasskey).mockRejectedValueOnce(new PasskeyError(code, code));
	await expect(enablePasskey()).rejects.toMatchObject({code});
	expect(helper.preparePasskey).toHaveBeenCalledTimes(1);
	expect(mockState.auth.passkeys[old.userId]).toBeUndefined();
	expect(mockState.auth.password).toBe("synthetic-password");
});

test("a failed protected login does not downgrade an already-created key", async () => {
	useNewAccount();
	jest.mocked(helper.login).mockRejectedValueOnce(new PasskeyError("verification-unavailable", "unavailable"));
	await expect(enablePasskey()).rejects.toMatchObject({code: "verification-unavailable"});
	expect(helper.preparePasskey).toHaveBeenCalledTimes(1);
	expect(mockState.auth.pendingPasskey?.authenticationMode).toBe("required");
	expect(helper.login).toHaveBeenCalledTimes(1);
});

test("an explicit request for verification does not fall back to silent creation", async () => {
	useNewAccount();
	jest.mocked(helper.preparePasskey).mockRejectedValueOnce(new PasskeyError("verification-unavailable", "unavailable"));
	await expect(enablePasskey("required")).rejects.toMatchObject({code: "verification-unavailable"});
	expect(helper.preparePasskey).toHaveBeenCalledTimes(1);
	expect(getPasskeyCapabilities).not.toHaveBeenCalled();
});

test("changing account while checking default capabilities cancels before creating a key", async () => {
	useNewAccount();
	jest.mocked(getPasskeyCapabilities).mockImplementationOnce(async () => {
		mockState.auth = {...mockState.auth, userId: ""};
		return {rootHint: false, verificationAvailability: "unsupported"};
	});
	await expect(enablePasskey()).rejects.toMatchObject({code: "canceled"});
	expect(helper.preparePasskey).not.toHaveBeenCalled();
	expect(mockState.auth.userId).toBe("");
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
	const failed = first.catch(error => error);
	expect(() => enablePasskey("required")).toThrow("正在设置，请稍候。");
	cancel(new PasskeyError("canceled", "登录已取消。"));
	expect(await failed).toMatchObject({code: "canceled"});
	await expect(enablePasskey("required")).resolves.toEqual(replacement("required"));
	await expect(enablePasskey("required")).resolves.toEqual(replacement("required"));
});

const legacyCredential = {...old, rpId: "tsinghua.edu.cn", authenticationMode: "required" as const};
const useLegacyAccount = (mode: "required" | "silent" = "required") => {
	mockState.auth = authReducer({...defaultAuth}, loginWithPasskey({...legacyCredential, authenticationMode: mode}));
	helper.passkeyCredential = undefined;
	jest.mocked(helper.hasAuthentication).mockReturnValue(false);
};

test.each(["required", "silent"] as const)("migration preserves the old %s policy independently of school UV requirements", async (mode) => {
	useLegacyAccount(mode);
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({rootHint: false, verificationAvailability: "unsupported"});
	jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValue(replacement(mode));
	await expect(migratePasskey()).resolves.toEqual(replacement(mode));
	expect(helper.preparePasskey).toHaveBeenCalledWith({authenticationMode: mode});
	expect(getPasskeyCapabilities).not.toHaveBeenCalled();
	expect(mockState.auth.silentPasskeyLogin[old.userId]).toBe(mode === "silent");
});

test("v3.20.0 migration authenticates with the old Passkey and retires it only after durable activation", async () => {
	useLegacyAccount();
	let durable = false;
	jest.mocked(persistor.flush).mockImplementation(async () => {
		if (mockState.auth.passkeys[old.userId]?.credentialId === "new-credential") durable = true;
	});
	jest.mocked(helper.removePasskey).mockImplementation(async (credential) => {
		expect(durable).toBe(true);
		expect(credential).toEqual(legacyCredential);
	});
	await expect(migratePasskey()).resolves.toEqual(replacement("required"));
	expect(helper.loginForPasskeyMigration).toHaveBeenCalledWith(legacyCredential);
	expect(helper.login).toHaveBeenCalledWith({method: "passkey", credential: replacement("required")});
	expect(mockState.auth.passkeyRenewalRequired[old.userId]).toBeUndefined();
	expect(mockState.auth.retiredPasskeys).toEqual([]);
	expect(helper.removePasskey).toHaveBeenCalledTimes(1);
});

test("canceled migration retains the old credential and a pending replacement without rollback prompts", async () => {
	useLegacyAccount();
	jest.mocked(helper.login).mockRejectedValueOnce(new PasskeyError("canceled", "canceled"));
	await expect(migratePasskey()).rejects.toMatchObject({code: "canceled"});
	expect(mockState.auth.passkeys[old.userId]).toEqual(legacyCredential);
	expect(mockState.auth.passkeyRenewalRequired[old.userId]).toBe(legacyCredential.credentialId);
	expect(mockState.auth.pendingPasskey).toEqual(replacement("required"));
	expect(helper.login).toHaveBeenCalledTimes(1);
	expect(helper.removePasskey).not.toHaveBeenCalled();
});

test("password recovery can bootstrap migration without invoking the legacy signer", async () => {
	useLegacyAccount();
	await migratePasskey("synthetic-recovery-password");
	expect(helper.loginForPasskeyMigration).not.toHaveBeenCalled();
	expect(helper.login).toHaveBeenNthCalledWith(1, {userId: old.userId, password: "synthetic-recovery-password"});
	expect(mockState.auth.password).toBe("");
});

test("an interrupted v3.20.0 enrollment is reconciled before creating an id. key", async () => {
	useLegacyAccount();
	const pending = {...legacyCredential, credentialId: "interrupted", keyId: "interrupted-key"};
	mockState.auth = {...mockState.auth, pendingPasskey: pending};
	jest.mocked(helper.listPasskeys).mockResolvedValue([{credentialId: old.credentialId}, {credentialId: pending.credentialId}]);
	await migratePasskey();
	expect(helper.removePasskey).toHaveBeenNthCalledWith(1, pending);
	expect(helper.removePasskey).toHaveBeenNthCalledWith(2, legacyCredential);
	expect(mockState.auth.pendingPasskey).toBeUndefined();
});

test("failed activation persistence retains the gate and retries persistence without another rotation", async () => {
	useLegacyAccount();
	let fail = true;
	jest.mocked(persistor.flush).mockImplementation(async () => {
		if (fail && mockState.auth.passkeys[old.userId]?.credentialId === "new-credential") {
			fail = false;
			throw new Error("storage unavailable");
		}
	});
	await expect(migratePasskey()).rejects.toThrow("storage unavailable");
	expect(mockState.auth.passkeyRenewalRequired[old.userId]).toBe(legacyCredential.credentialId);
	expect(helper.removePasskey).not.toHaveBeenCalled();
	await migratePasskey();
	expect(helper.preparePasskey).toHaveBeenCalledTimes(1);
	expect(helper.loginForPasskeyMigration).toHaveBeenCalledTimes(1);
	expect(mockState.auth.passkeyRenewalRequired[old.userId]).toBeUndefined();
	expect(helper.removePasskey).toHaveBeenCalledWith(legacyCredential);
});

test("revocation failure retains exact old-key metadata without requiring migration again", async () => {
	useLegacyAccount();
	jest.mocked(helper.removePasskey).mockRejectedValueOnce(new Error("offline"));
	await migratePasskey();
	expect(mockState.auth.passkeys[old.userId]).toEqual(replacement("required"));
	expect(mockState.auth.passkeyRenewalRequired[old.userId]).toBeUndefined();
	expect(mockState.auth.retiredPasskeys).toEqual([legacyCredential]);
	expect(helper.passkeyAuthenticator!.deleteCredential).not.toHaveBeenCalled();
});
