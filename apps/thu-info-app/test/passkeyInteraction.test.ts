import {expect, jest, test} from "@jest/globals";
import {waitForPasskeyInteraction} from "../src/utils/passkeyInteraction";

const fixture = () => {
	const state = {loggedInUserId: "2026000000", selectedUserId: "2026000000", keyId: "local-key", foreground: false, appLocked: false};
	let changed!: () => void;
	const remove = jest.fn();
	const wait = () => waitForPasskeyInteraction("local-key", () => state, (check) => { changed = check; return remove; });
	return {state, wait, change: () => changed(), remove};
};
test("background recovery waits until the app is active and unlocked", async () => {
	const f = fixture();
	const ready = jest.fn();
	const result = f.wait().then(ready);
	await Promise.resolve();
	expect(ready).not.toHaveBeenCalled();
	f.state.foreground = true;
	f.state.appLocked = true;
	f.change();
	await Promise.resolve();
	expect(ready).not.toHaveBeenCalled();
	f.state.appLocked = false;
	f.change();
	await result;
	expect(ready).toHaveBeenCalledTimes(1);
	expect(f.remove).toHaveBeenCalledTimes(1);
});
test.each(["loggedInUserId", "selectedUserId", "keyId"] as const)("changing %s cancels a pending login", async (field) => {
	const f = fixture();
	const result = f.wait();
	f.state[field] = "other";
	f.change();
	await expect(result).rejects.toMatchObject({code: "canceled"});
	expect(f.remove).toHaveBeenCalledTimes(1);
});
test("an explicit logged-out login can interact with its selected account", async () => {
	const f = fixture();
	f.state.loggedInUserId = "";
	f.state.foreground = true;
	await expect(f.wait()).resolves.toBeUndefined();
	expect(f.remove).toHaveBeenCalledTimes(1);
});
