import {afterEach, beforeEach, expect, jest, test} from "@jest/globals";
import {act, cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react-native";
import {PasskeyMigrationScreen} from "../src/ui/settings/passkeyMigration";
import type {RootNav, PasskeyMigrationRouteProp} from "../src/components/Root";
import {getPasskeyCapabilities} from "../src/utils/passkeyNative";
import {migratePasskey} from "../src/utils/passkey";
import {authReducer, defaultAuth, loginWithPasskey} from "../src/redux/slices/auth";
import {helper, store} from "../src/redux/store";
import {PasskeyError} from "@thu-info/lib/src/utils/error";
import zh from "../src/assets/translations/zh";

const legacy = {userId: "2026000000", keyId: "legacy-key", credentialId: "legacy-id", userHandle: "handle",
	rpId: "tsinghua.edu.cn", publicKeyX: "x", publicKeyY: "y", protectionLevel: "unknown" as const, authenticationMode: "required" as const};
let mockState = {auth: {...defaultAuth}, config: {language: "zh"}};
jest.mock("../src/redux/store", () => ({currState: () => mockState ?? {config: {language: "zh"}}, store: {dispatch: jest.fn()}, helper: {logout: jest.fn()}}));
jest.mock("../src/utils/passkeyNative", () => ({getPasskeyCapabilities: jest.fn()}));
jest.mock("../src/utils/passkey", () => ({migratePasskey: jest.fn()}));
const navigation = {} as RootNav;
const route = (reason: "upgrade" | "rp-changed" = "upgrade") => ({params: {userId: legacy.userId, reason}} as PasskeyMigrationRouteProp);
beforeEach(() => {
	jest.resetAllMocks();
	mockState.auth = authReducer(defaultAuth, loginWithPasskey(legacy));
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({rootHint: false, verificationAvailability: "available"});
	jest.mocked(helper.logout).mockResolvedValue(undefined);
});
afterEach(async () => { await cleanup(); });

test("upgrade offers a mandatory update using the old credential, with no skip control", async () => {
	await render(<PasskeyMigrationScreen navigation={navigation} route={route()} />);
	expect(screen.getByText(zh.passkeyMigrationPrompt)).toBeTruthy();
	await fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	await waitFor(() => expect(migratePasskey).toHaveBeenCalledWith(undefined));
	expect(screen.queryByText("跳过")).toBeNull();
});

test("canceling verification retains the old credential and permits retry", async () => {
	jest.mocked(migratePasskey).mockRejectedValueOnce(new PasskeyError("canceled", "canceled"));
	await render(<PasskeyMigrationScreen navigation={navigation} route={route()} />);
	await fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	await screen.findByText(zh.passkeyMigrationCanceled);
	expect(mockState.auth.passkeys[legacy.userId]).toEqual(legacy);
	expect(screen.getByTestId("passkeyMigrationStart")).toBeEnabled();
});

test("an unavailable old key exposes password recovery without persisting the entered password", async () => {
	jest.mocked(migratePasskey).mockRejectedValueOnce(new PasskeyError("missing", "missing"));
	await render(<PasskeyMigrationScreen navigation={navigation} route={route()} />);
	await fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	await screen.findByText(zh.passkeyMigrationPasswordRequired);
	await fireEvent.changeText(screen.getByTestId("passkeyMigrationPassword"), "synthetic-password");
	await fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	await waitFor(() => expect(migratePasskey).toHaveBeenLastCalledWith("synthetic-password"));
	expect(screen.getByTestId("passkeyMigrationPassword").props.value).toBe("");
	expect(store.dispatch).not.toHaveBeenCalled();
});

test("a counter conflict explains the school rejection and opens password recovery", async () => {
	jest.mocked(migratePasskey).mockRejectedValueOnce(new PasskeyError("counter-mismatch", "counter mismatch"));
	await render(<PasskeyMigrationScreen navigation={navigation} route={route()} />);
	await fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	await screen.findByText(zh.passkeyCounterMismatch);
	expect(screen.getByTestId("passkeyMigrationPassword")).toBeTruthy();
	expect(screen.queryByText(zh.passkeyMigrationPasswordRequired)).toBeNull();
	expect(mockState.auth.passkeys[legacy.userId]).toEqual(legacy);
	expect(store.dispatch).not.toHaveBeenCalled();
});

test("a repeated server RP change starts with password recovery and an explicit explanation", async () => {
	await render(<PasskeyMigrationScreen navigation={navigation} route={route("rp-changed")} />);
	expect(screen.getByText(zh.passkeyRpChanged)).toBeTruthy();
	expect(screen.getByTestId("passkeyMigrationStart")).toBeDisabled();
	expect(screen.queryByTestId("passkeyMigrationPasswordChoice")).toBeNull();
});

test("root detection is displayed before migration starts", async () => {
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({rootHint: true, verificationAvailability: "available"});
	await render(<PasskeyMigrationScreen navigation={navigation} route={route()} />);
	await fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	await screen.findByText(zh.passkeyRootHint);
	expect(migratePasskey).not.toHaveBeenCalled();
	await fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	await waitFor(() => expect(migratePasskey).toHaveBeenCalledTimes(1));
});

test("device verification unavailability does not start account migration", async () => {
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({rootHint: false, verificationAvailability: "not-configured"});
	await render(<PasskeyMigrationScreen navigation={navigation} route={route()} />);
	await fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	await screen.findByText(zh.passkeyVerificationUnavailable);
	expect(migratePasskey).not.toHaveBeenCalled();
});

test("an old silent credential can migrate without configured system verification", async () => {
	mockState.auth = authReducer(defaultAuth, loginWithPasskey({...legacy, authenticationMode: "silent"}));
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({rootHint: false, verificationAvailability: "not-configured"});
	await render(<PasskeyMigrationScreen navigation={navigation} route={route()} />);
	await fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	await waitFor(() => expect(migratePasskey).toHaveBeenCalledWith(undefined));
	expect(screen.queryByText(zh.passkeyVerificationUnavailable)).toBeNull();
});

test("a capability result from a previous account cannot start migrating the new account", async () => {
	let resolve!: (value: Awaited<ReturnType<typeof getPasskeyCapabilities>>) => void;
	jest.mocked(getPasskeyCapabilities).mockReturnValueOnce(new Promise(done => { resolve = done; }));
	await render(<PasskeyMigrationScreen navigation={navigation} route={route()} />);
	const press = fireEvent.press(screen.getByTestId("passkeyMigrationStart"));
	mockState.auth = {...mockState.auth, userId: "2026000001"};
	await act(async () => resolve({rootHint: false, verificationAvailability: "available"}));
	await press;
	expect(migratePasskey).not.toHaveBeenCalled();
});
