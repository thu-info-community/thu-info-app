import type {PasskeyCredential, PasskeyAuthenticationMode} from "@thu-info/lib";
import {PasskeyError} from "@thu-info/lib/src/utils/error";
import {getCsrfToken, roam} from "@thu-info/lib/src/lib/core";
import {currState, helper, persistor, store} from "../redux/store";
import {forgetPasskey, forgetRetiredPasskey, loginWithPasskey, setPendingPasskey, requirePasskeyRenewal, completePasskeyRenewal} from "../redux/slices/auth";
import type {AuthState} from "../redux/slices/auth";
import {PASSKEY_RP_ID} from "@thu-info/lib/src/lib/passkey";
import {LEGACY_PASSKEY_RP_ID} from "@thu-info/lib/src/lib/passkeyMigration";
import {getPasskeyCapabilities} from "./passkeyNative";

let pendingOperation: Promise<PasskeyCredential | void> | undefined;
const removeIfRegistered = async (credential: PasskeyCredential) => {
    if ((await helper.listPasskeys()).some((item) => item.credentialId === credential.credentialId)) await helper.removePasskey(credential);
    await helper.passkeyAuthenticator?.deleteCredential(credential.keyId);
};
const cleanRetired = async () => {
    for (const credential of currState().auth.retiredPasskeys ?? []) {
        if (credential.userId !== currState().auth.userId) continue;
        await removeIfRegistered(credential);
        store.dispatch(forgetRetiredPasskey(credential.credentialId));
        await persistor.flush();
    }
};
const singleOperation = <T extends PasskeyCredential | void>(operation: () => Promise<T>): Promise<T> => {
    if (pendingOperation) throw new PasskeyError("busy", "正在设置，请稍候。");
    const promise = operation();
    pendingOperation = promise;
    return promise.finally(() => { pendingOperation = undefined; });
};

const configurePasskey = (requestedMode?: PasskeyAuthenticationMode, bootstrap?: (before: AuthState) => Promise<void>): Promise<PasskeyCredential> => singleOperation(async () => {
    const before = currState().auth;
    const existing = before.passkeys[before.userId];
    let mode = requestedMode ?? existing?.authenticationMode ??
        (before.silentPasskeyLogin[before.userId] ? "silent" : "required");
    const canFallbackToSilent = requestedMode === undefined && !existing;
    if (!before.userId || (!bootstrap && !helper.hasAuthentication())) throw new PasskeyError("session", "请先登录。");
    let credential = before.pendingPasskey;
    if (credential && credential.userId !== before.userId) throw new PasskeyError("session", "请先登录之前的账号，完成 Passkey 设置。");
    const previousHook = helper.loginErrorHook;
    helper.loginErrorHook = undefined;
    const ensureCurrentAccount = () => {
        if (currState().auth.userId !== before.userId) throw new PasskeyError("canceled", "登录已取消。");
    };
    let activated = false;
    try {
        if (bootstrap) {
            const replaced = before.passkeyRenewalRequired[before.userId];
            if (replaced && existing?.rpId === PASSKEY_RP_ID && existing.credentialId !== replaced && before.authMethod === "passkey") {
                await persistor.flush();
                ensureCurrentAccount();
                store.dispatch(completePasskeyRenewal(before.userId));
                await persistor.flush();
                await cleanRetired().catch(() => undefined);
                return existing;
            }
            store.dispatch(requirePasskeyRenewal(before.userId));
            await bootstrap(before);
            ensureCurrentAccount();
        }
        await roam(helper, "id_website", "");
        ensureCurrentAccount();
        if (canFallbackToSilent && mode === "required") {
            const {verificationAvailability} = await getPasskeyCapabilities();
            ensureCurrentAccount();
            if (["not-configured", "unsupported"].includes(verificationAvailability)) mode = "silent";
        }
        if (credential && (credential.authenticationMode !== mode || credential.rpId !== PASSKEY_RP_ID)) {
            await removeIfRegistered(credential);
            store.dispatch(setPendingPasskey(undefined));
            await persistor.flush();
            credential = undefined;
        }
        if (!credential) {
            try {
                credential = await helper.preparePasskey({authenticationMode: mode});
            } catch (error) {
                ensureCurrentAccount();
                // Only an unsupported default key creation may fall back. Never
                // reinterpret cancellation or a protected key's signing failure.
                if (!canFallbackToSilent || mode !== "required" || !(error instanceof PasskeyError) ||
                    error.code !== "verification-unavailable") throw error;
                mode = "silent";
                credential = await helper.preparePasskey({authenticationMode: mode});
            }
            ensureCurrentAccount();
            store.dispatch(setPendingPasskey(credential));
            await persistor.flush();
        }
        const nativeKey = await helper.passkeyAuthenticator?.getCredential(credential.keyId);
        if (!nativeKey) {
            throw new PasskeyError("missing", "此设备的 Passkey 不可用，请重新设置。");
        }
        if (nativeKey.authenticationMode !== mode || nativeKey.rpId !== PASSKEY_RP_ID) throw new PasskeyError("invalid", "Passkey 设置未完成，请重新设置。");
        const registered = await helper.listPasskeys();
        if (!registered.some((item) => item.credentialId === credential!.credentialId)) await helper.registerPasskey(credential);
        credential = {...credential, name: credential.name || await helper.trustFingerprintNameHook()};
        await helper.renamePasskey(credential, credential.name!);
        ensureCurrentAccount();

        // Full login clears both JS/native cookies; do not remove the password before this succeeds.
        await helper.login({method: "passkey", credential});
        const account = await helper.getUserInfo();
        if (account.userId !== before.userId) throw new PasskeyError("invalid", "登录账号不一致，请重新登录。");
        await getCsrfToken();
        await helper.getCalendar();
        ensureCurrentAccount();
        store.dispatch(loginWithPasskey(credential));
        activated = true;
        await persistor.flush();
        ensureCurrentAccount();
        if (bootstrap) {
            store.dispatch(completePasskeyRenewal(before.userId));
            await persistor.flush();
        }
        // Keep cleanup metadata until revocation succeeds; never remove the newly active key on a storage error.
        await cleanRetired().catch(() => undefined);
        return credential;
    } catch (error) {
        if (activated) throw error;
        ensureCurrentAccount();
        // Preserve the pre-existing mode. A failed server cleanup keeps the pending record for reconciliation.
        helper.userId = before.userId;
        helper.password = before.password;
        helper.passkeyCredential = before.authMethod === "passkey" && existing?.rpId === PASSKEY_RP_ID ? existing : undefined;
        // Cancellation must not cause a second prompt during rollback. Keep the
        // pending credential for cleanup/reconciliation on the next explicit attempt.
        if (bootstrap || (error instanceof PasskeyError && ["canceled", "locked", "interaction-required", "verification-unavailable"].includes(error.code))) throw error;
        try {
            await helper.login();
            await roam(helper, "id_website", "");
            if (credential) await removeIfRegistered(credential);
            store.dispatch(setPendingPasskey(undefined));
            await persistor.flush();
        } catch { /* Keep the pending key and public metadata so the next attempt can reconcile. */ }
        throw error;
    } finally {
        helper.loginErrorHook = previousHook;
    }
});

export const enablePasskey = (requestedMode?: PasskeyAuthenticationMode) => configurePasskey(requestedMode);

export const migratePasskey = (password?: string) => configurePasskey(undefined, async (before) => {
    if (password !== undefined) {
        await helper.login({userId: before.userId, password});
    } else {
        const old = before.passkeys[before.userId];
        if (old?.rpId !== LEGACY_PASSKEY_RP_ID) throw new PasskeyError("password-required", "请使用学校密码重新注册 Passkey。");
        await helper.loginForPasskeyMigration(old);
    }
});

/** Retry exact-credential cleanup after a later successful sign-in. */
export const cleanupRetiredPasskeys = (): Promise<void> => {
    if (!currState().auth.retiredPasskeys?.some((key) => key.userId === currState().auth.userId)) return Promise.resolve();
    return singleOperation(async () => {
        await roam(helper, "id_website", "");
        await cleanRetired();
    });
};

export const disablePasskey = (): Promise<void> => singleOperation(async () => {
    const credential = currState().auth.passkeys[currState().auth.userId];
    if (!credential) return;
    await roam(helper, "id_website", "");
    await cleanRetired();
    await removeIfRegistered(credential);
    await helper.logout().catch(() => undefined);
    store.dispatch(forgetPasskey(credential.userId));
    await persistor.flush();
});
