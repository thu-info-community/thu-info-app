import {expect, jest, test} from "@jest/globals";
import {migrateAuthStorage, sanitizeAuth} from "../src/redux/authPersistence";
import {authReducer, defaultAuth, login, loginWithPasskey, logout} from "../src/redux/slices/auth";
import type {PasskeyCredential} from "@thu-info/lib";

const credential: PasskeyCredential = {
	userId: "2026000000", keyId: "local", credentialId: "credential", userHandle: "handle",
	rpId: "tsinghua.edu.cn", publicKeyX: "x", publicKeyY: "y", protectionLevel: "unknown",
};
const authKey = "com.unidy2002.thuinfo.persist.auth.auth";
const storage = (values: Record<string, string> = {}) => ({
	values,
	getItem: jest.fn(async (key: string) => values[key] ?? null),
	setItem: jest.fn(async (key: string, value: string) => { values[key] = value; }),
});
const legacy = {...defaultAuth, userId: credential.userId, password: "test-password"};

test("moves legacy secrets into protected storage before dropping root copies", async () => {
	const root = storage({"persist:root": JSON.stringify({auth: JSON.stringify(legacy), config: "{}", credentials: JSON.stringify({dormPassword: "test-dorm"})})});
	const protectedStore = storage();
	await migrateAuthStorage(root, protectedStore);
	expect(JSON.parse(root.values["persist:root"])).toEqual({config: "{}"});
	const nested = JSON.parse(protectedStore.values[authKey]);
	expect(JSON.parse(nested.password)).toBe("test-password");
	expect(JSON.parse(nested.passkeys)).toEqual({});
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
	const enabled = authReducer(legacy, loginWithPasskey(credential));
	expect(enabled.password).toBe("");
	expect(enabled.authMethod).toBe("passkey");
	expect(sanitizeAuth({...enabled, password: "stale"}).password).toBe("");
	const loggedOut = authReducer(enabled, logout());
	expect(loggedOut.passkeys[credential.userId]).toEqual(credential);
	const recovered = authReducer(loggedOut, login({userId: credential.userId, password: "transient"}));
	expect(recovered.password).toBe("");
	expect(recovered.authMethod).toBe("passkey");
});
