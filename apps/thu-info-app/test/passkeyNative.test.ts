import {afterEach, beforeEach, expect, jest, test} from "@jest/globals";
import {Platform} from "react-native";
import NativePasskey, * as PasskeyModule from "rtn-passkey";
import {createPasskeyAuthenticator, getPasskeyCapabilities} from "../src/utils/passkeyNative";

jest.mock("rtn-passkey", () => ({__esModule: true, default: {
	getCapabilities: jest.fn(), createCredential: jest.fn(), getCredential: jest.fn(), signAssertion: jest.fn(), deleteCredential: jest.fn(),
}}));
const getCapabilities = jest.mocked(NativePasskey!.getCapabilities);

beforeEach(() => { jest.replaceProperty(Platform, "OS", "android"); });
afterEach(() => { jest.restoreAllMocks(); jest.resetAllMocks(); });

test.each<[string, boolean]>([
	["{\"available\":true,\"rootDetected\":true}", true],
	["{\"available\":true,\"rootDetected\":false}", false],
	["{\"available\":true}", false],
	["{\"rootDetected\":\"true\"}", false],
	["null", false],
	["invalid JSON", false],
])("root hint handles native capabilities %s", async (response, expected) => {
	getCapabilities.mockResolvedValue(response);
	expect(await getPasskeyCapabilities()).toEqual({rootHint: expected, verificationAvailability: "unknown"});
	expect(getCapabilities).toHaveBeenCalledTimes(1);
});

test("a native check failure does not prevent Passkey setup", async () => {
	getCapabilities.mockRejectedValue(new Error("native check unavailable"));
	expect(await getPasskeyCapabilities()).toEqual({rootHint: false, verificationAvailability: "unknown"});
});

test("an unavailable native module has no root hint", async () => {
	jest.replaceProperty(PasskeyModule, "default", null);
	expect(await getPasskeyCapabilities()).toEqual({rootHint: false, verificationAvailability: "unknown"});
	expect(getCapabilities).not.toHaveBeenCalled();
});

test.each(["ios", "harmony"])("%s reports verification capabilities without the Android root hint", async (os) => {
	jest.replaceProperty(Platform, "OS", os as typeof Platform.OS);
	getCapabilities.mockResolvedValue("{\"rootDetected\":true,\"verificationAvailability\":\"available\"}");
	expect(await getPasskeyCapabilities()).toEqual({rootHint: false, verificationAvailability: "available"});
	expect(getCapabilities).toHaveBeenCalledTimes(1);
});

const key = {keyId: "local-key", credentialId: "credential", publicKeyX: "x", publicKeyY: "y", protectionLevel: "unknown", authenticationMode: "required"};
const assertion = {clientDataJSON: "YQ", authenticatorData: "Yg", signature: "Yw"};
test.each(["available", "not-configured", "unsupported", "unknown"])("reports native verification availability %s", async (value) => {
	getCapabilities.mockResolvedValue(JSON.stringify({verificationAvailability: value}));
	expect((await getPasskeyCapabilities()).verificationAvailability).toBe(value);
});
test("an unconfirmed native capability remains unknown", async () => {
	getCapabilities.mockRejectedValue(new Error("unavailable"));
	expect((await getPasskeyCapabilities()).verificationAvailability).toBe("unknown");
});
test.each([undefined, "silent"] as const)("creates keys with the requested native policy %s", async (mode) => {
	const expected = mode ?? "required";
	jest.mocked(NativePasskey!.createCredential).mockResolvedValue(JSON.stringify({...key, authenticationMode: expected}));
	expect((await createPasskeyAuthenticator(() => false).createCredential({authenticationMode: mode})).authenticationMode).toBe(expected);
	expect(NativePasskey!.createCredential).toHaveBeenCalledWith(expected);
});
test("rejects a key whose native policy differs from the requested policy", async () => {
	jest.mocked(NativePasskey!.createCredential).mockResolvedValue(JSON.stringify({...key, authenticationMode: "silent"}));
	jest.mocked(NativePasskey!.deleteCredential).mockResolvedValue(undefined);
	await expect(createPasskeyAuthenticator(() => false).createCredential()).rejects.toMatchObject({code: "invalid"});
	expect(NativePasskey!.deleteCredential).toHaveBeenCalledWith(key.keyId);
});
test.each(["silent", "required"] as const)("only required credentials wait for foreground interaction: %s", async (mode) => {
	const wait = jest.fn(async () => {});
	jest.mocked(NativePasskey!.getCredential).mockResolvedValue(JSON.stringify({...key, authenticationMode: mode}));
	await createPasskeyAuthenticator(() => false, wait).prepareAssertion!(key.keyId);
	expect(wait).toHaveBeenCalledTimes(mode === "required" ? 1 : 0);
});
test.each([undefined, "legacy", null])("rejects a missing or invalid native policy: %s", async (authenticationMode) => {
	jest.mocked(NativePasskey!.getCredential).mockResolvedValue(JSON.stringify({...key, authenticationMode}));
	await expect(createPasskeyAuthenticator(() => false).getCredential(key.keyId)).rejects.toMatchObject({code: "invalid"});
});
test.each([
	["PASSKEY_CANCELED", "canceled"], ["PASSKEY_AUTH_UNAVAILABLE", "verification-unavailable"],
	["PASSKEY_KEY_INVALIDATED", "missing"], ["PASSKEY_INTERACTION_REQUIRED", "interaction-required"],
	["PASSKEY_LOCKED", "locked"], ["PASSKEY_UNAVAILABLE", "unavailable"],
])("keeps native failure %s distinct", async (nativeCode, code) => {
	jest.mocked(NativePasskey!.signAssertion).mockRejectedValue({code: nativeCode});
	await expect(createPasskeyAuthenticator(() => false).signAssertion(key.keyId, "challenge")).rejects.toMatchObject({code});
});
test("reads HarmonyOS errors whose bridge code is numeric", async () => {
	jest.mocked(NativePasskey!.signAssertion).mockRejectedValue({code: 1, message: "Error: PASSKEY_CANCELED"});
	await expect(createPasskeyAuthenticator(() => false).signAssertion(key.keyId, "challenge")).rejects.toMatchObject({code: "canceled"});
});
test("native credential read failures are terminal Passkey errors", async () => {
	jest.mocked(NativePasskey!.getCredential).mockRejectedValue({code: "PASSKEY_KEY_INVALIDATED"});
	await expect(createPasskeyAuthenticator(() => false).getCredential(key.keyId)).rejects.toMatchObject({code: "missing"});
});
test("does not return a signature after the app locks", async () => {
	let locked = false;
	jest.mocked(NativePasskey!.signAssertion).mockImplementation(async () => { locked = true; return JSON.stringify(assertion); });
	await expect(createPasskeyAuthenticator(() => locked).signAssertion(key.keyId, "challenge")).rejects.toMatchObject({code: "locked"});
});
