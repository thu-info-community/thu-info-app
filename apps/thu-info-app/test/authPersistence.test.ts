import {expect, jest, test} from "@jest/globals";
import {migrateAuthStorage, sanitizeAuth} from "../src/redux/authPersistence";
import {authReducer, defaultAuth, dismissPasskeyUpgrade, login, loginWithPasskey, logout, setSilentPasskeyLogin, requirePasskeyRenewal} from "../src/redux/slices/auth";
import {needsPasskeyRenewal} from "../src/redux/passkeyMigration";
import type {PasskeyCredential} from "@thu-info/lib";

const credential: PasskeyCredential = {
	userId: "2026000000", keyId: "local", credentialId: "credential", userHandle: "handle",
	rpId: "tsinghua.edu.cn", publicKeyX: "x", publicKeyY: "y", protectionLevel: "unknown", authenticationMode: "silent",
};
const authKey = "com.unidy2002.thuinfo.persist.auth.auth";
const storage = (values: Record<string, string> = {}) => ({
	values,
	getItem: jest.fn(async (key: string) => values[key] ?? null),
	setItem: jest.fn(async (key: string, value: string) => { values[key] = value; }),
});
const legacy = {userId: credential.userId, password: "test-password", fingerprint: "test-fingerprint"};
const passwordAuth = sanitizeAuth(legacy);

test("moves legacy secrets into protected storage before dropping root copies", async () => {
	const root = storage({"persist:root": JSON.stringify({auth: JSON.stringify(legacy), config: "{}", credentials: JSON.stringify({dormPassword: "test-dorm"})})});
	const protectedStore = storage();
	await migrateAuthStorage(root, protectedStore);
	expect(JSON.parse(root.values["persist:root"])).toEqual({config: "{}"});
	const nested = JSON.parse(protectedStore.values[authKey]);
	expect(JSON.parse(nested.password)).toBe("test-password");
	expect(JSON.parse(nested.passkeys)).toEqual({});
	expect(JSON.parse(nested.silentPasskeyLogin)).toEqual({});
	expect(JSON.parse(nested.authMethod)).toBe("password");
	expect(JSON.parse(nested.fingerprint)).toBe(legacy.fingerprint);
	expect(JSON.parse(nested.passkeyUpgradePending)).toBe(true);
});

test("only an upgraded password account gets the one-time Passkey reminder", () => {
	expect(sanitizeAuth(legacy).passkeyUpgradePending).toBe(true);
	expect(sanitizeAuth(defaultAuth).passkeyUpgradePending).toBe(false);
	expect(sanitizeAuth({}).passkeyUpgradePending).toBe(false);
	expect(sanitizeAuth({...legacy, userId: "8888"}).passkeyUpgradePending).toBe(false);
	expect(sanitizeAuth({...legacy, passkeys: {[credential.userId]: credential}}).passkeyUpgradePending).toBe(false);
	const dismissed = authReducer(sanitizeAuth(legacy), dismissPasskeyUpgrade());
	expect(sanitizeAuth(dismissed).passkeyUpgradePending).toBe(false);
	const loggedIn = authReducer(defaultAuth, login(legacy));
	expect(sanitizeAuth(loggedIn).passkeyUpgradePending).toBe(false);
});

test("the released v3.20.0 credential is migrated per account without relabeling its RP", () => {
	const released = {...legacy, authMethod: "passkey" as const, passkeys: {[credential.userId]: credential}, silentPasskeyLogin: {[credential.userId]: true}};
	const hydrated = sanitizeAuth(released);
	expect(needsPasskeyRenewal(hydrated)).toBe(true);
	expect(hydrated.passkeys[credential.userId].rpId).toBe("tsinghua.edu.cn");
	const signedOut = authReducer(hydrated, logout());
	expect(needsPasskeyRenewal(signedOut)).toBe(false);
	const selected = authReducer(signedOut, requirePasskeyRenewal(credential.userId));
	expect(needsPasskeyRenewal(selected)).toBe(true);
	expect(selected.userId).toBe(credential.userId);
});

test("persisted replacement acknowledges migration on restart while keeping failed cleanup metadata", () => {
	const old = authReducer(sanitizeAuth(legacy), loginWithPasskey(credential));
	const required = authReducer(old, requirePasskeyRenewal(credential.userId));
	const replacement = {...credential, rpId: "id.tsinghua.edu.cn", keyId: "new-key", credentialId: "new-id"};
	const activated = authReducer(required, loginWithPasskey(replacement));
	expect(needsPasskeyRenewal(activated)).toBe(true);
	const restored = sanitizeAuth(activated);
	expect(needsPasskeyRenewal(restored)).toBe(false);
	expect(restored.retiredPasskeys).toEqual([credential]);
	expect(restored.password).toBe("");
});

test("existing protected Passkey state wins over a stale root password", async () => {
	const root = storage({"persist:root": JSON.stringify({auth: JSON.stringify(legacy)})});
	const saved = "already-protected-state";
	const protectedStore = storage({[authKey]: saved});
	await migrateAuthStorage(root, protectedStore);
	expect(protectedStore.values[authKey]).toBe(saved);
	expect(root.values["persist:root"]).toBe("{}");
	expect(protectedStore.setItem).not.toHaveBeenCalled();
});

test("failed protected writes retain the legacy copy for recovery", async () => {
	const raw = JSON.stringify({auth: JSON.stringify(legacy)});
	const root = storage({"persist:root": raw});
	const protectedStore = storage();
	protectedStore.setItem.mockRejectedValueOnce(new Error("storage unavailable"));
	await expect(migrateAuthStorage(root, protectedStore)).rejects.toThrow("storage unavailable");
	expect(root.values["persist:root"]).toBe(raw);
	expect(root.setItem).not.toHaveBeenCalled();
});

test("activation and hydration erase passwords while logout retains discoverable credentials", () => {
	const enabled = authReducer(passwordAuth, loginWithPasskey(credential));
	expect(enabled.password).toBe("");
	expect(enabled.authMethod).toBe("passkey");
	expect(sanitizeAuth({...enabled, password: "stale"}).password).toBe("");
	const loggedOut = authReducer(enabled, logout());
	expect(loggedOut.passkeys[credential.userId]).toEqual(credential);
	const recovered = authReducer(loggedOut, login({userId: credential.userId, password: "transient"}));
	expect(recovered.password).toBe("transient");
	expect(recovered.authMethod).toBe("password");
	expect(recovered.passkeys[credential.userId]).toEqual(credential);
	expect(sanitizeAuth(recovered).authMethod).toBe("password");
	expect(sanitizeAuth(recovered).password).toBe("transient");
});

test("silent preferences apply per account on this device and survive logout", () => {
	const first = authReducer(passwordAuth, setSilentPasskeyLogin({userId: credential.userId, enabled: true}));
	const next = authReducer(first, login({userId: "2026000001", password: "synthetic-password"}));
	expect(next.silentPasskeyLogin[next.userId]).toBeUndefined();
	expect(authReducer(next, logout()).silentPasskeyLogin[credential.userId]).toBe(true);
});
test("hydration trusts explicit enrolled policies over preferences", () => {
	const state = sanitizeAuth({...legacy, passkeys: {
		[credential.userId]: credential,
		"2026000001": {...credential, userId: "2026000001", authenticationMode: "required"},
	}, silentPasskeyLogin: {[credential.userId]: false, "2026000001": true}});
	expect(state.silentPasskeyLogin).toEqual({[credential.userId]: true, "2026000001": false});
});
test("an enrolled preference changes only with successful credential replacement", () => {
	const old = authReducer(passwordAuth, loginWithPasskey(credential));
	const ignored = authReducer(old, setSilentPasskeyLogin({userId: credential.userId, enabled: false}));
	expect(ignored.silentPasskeyLogin[credential.userId]).toBe(true);
	const next = authReducer(ignored, loginWithPasskey({...credential, keyId: "new-key", credentialId: "new-credential", authenticationMode: "required"}));
	expect(next.silentPasskeyLogin[credential.userId]).toBe(false);
	expect(next.retiredPasskeys).toEqual([credential]);
	expect(next.password).toBe("");
});
