import {afterEach, beforeEach, expect, jest, test} from "@jest/globals";
import {Platform} from "react-native";
import NativePasskey, * as PasskeyModule from "rtn-passkey";
import {getPasskeyRootHint} from "../src/utils/passkeyNative";

jest.mock("rtn-passkey", () => ({__esModule: true, default: {getCapabilities: jest.fn()}}));
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
	expect(await getPasskeyRootHint()).toBe(expected);
});

test("a native check failure does not prevent Passkey setup", async () => {
	getCapabilities.mockRejectedValue(new Error("native check unavailable"));
	expect(await getPasskeyRootHint()).toBe(false);
});

test("an unavailable native module has no root hint", async () => {
	jest.replaceProperty(PasskeyModule, "default", null);
	expect(await getPasskeyRootHint()).toBe(false);
	expect(getCapabilities).not.toHaveBeenCalled();
});

test.each(["ios", "harmony"])("%s does not run the Android root check", async (os) => {
	jest.replaceProperty(Platform, "OS", os as typeof Platform.OS);
	getCapabilities.mockResolvedValue("{\"rootDetected\":true}");
	expect(await getPasskeyRootHint()).toBe(false);
	expect(getCapabilities).not.toHaveBeenCalled();
});
