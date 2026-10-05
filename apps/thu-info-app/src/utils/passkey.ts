import type {PasskeyCredential, PasskeyAuthenticationMode} from "@thu-info/lib";
import {PasskeyError} from "@thu-info/lib/src/utils/error";
import {getCsrfToken, roam} from "@thu-info/lib/src/lib/core";
import {currState, helper, persistor, store} from "../redux/store";
import {forgetPasskey, forgetRetiredPasskey, loginWithPasskey, setPendingPasskey} from "../redux/slices/auth";

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

export const enablePasskey = (requestedMode?: PasskeyAuthenticationMode): Promise<PasskeyCredential> => singleOperation(async () => {
    const before = currState().auth;
    const existing = before.passkeys[before.userId];
    const mode = requestedMode ?? existing?.authenticationMode ??
        (before.silentPasskeyLogin[before.userId] ? "silent" : "required");
    if (!before.userId || !helper.hasAuthentication()) throw new PasskeyError("session", "请先登录。");
    let credential = before.pendingPasskey;
    if (credential && credential.userId !== before.userId) throw new PasskeyError("session", "请先登录之前的账号，完成 Passkey 设置。");
    const previousHook = helper.loginErrorHook;
    helper.loginErrorHook = undefined;
    const ensureCurrentAccount = () => {
        if (currState().auth.userId !== before.userId) throw new PasskeyError("canceled", "登录已取消。");
    };
    let activated = false;
    try {
        await roam(helper, "id_website", "");
        ensureCurrentAccount();
        if (credential && credential.authenticationMode !== mode) {
            await removeIfRegistered(credential);
            store.dispatch(setPendingPasskey(undefined));
            await persistor.flush();
            credential = undefined;
        }
        if (!credential) {
            credential = await helper.preparePasskey({authenticationMode: mode});
            store.dispatch(setPendingPasskey(credential));
            await persistor.flush();
        }
        const nativeKey = await helper.passkeyAuthenticator?.getCredential(credential.keyId);
        if (!nativeKey) {
            throw new PasskeyError("missing", "此设备的 Passkey 不可用，请重新设置。");
        }
        if (nativeKey.authenticationMode !== mode) throw new PasskeyError("invalid", "Passkey 设置未完成，请重新设置。");
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
        // Keep cleanup metadata until revocation succeeds; never remove the newly active key on a storage error.
        await cleanRetired().catch(() => undefined);
        return credential;
    } catch (error) {
        if (activated) throw error;
        ensureCurrentAccount();
        // Preserve the pre-existing mode. A failed server cleanup keeps the pending record for reconciliation.
        helper.userId = before.userId;
        helper.password = before.password;
        helper.passkeyCredential = before.authMethod === "passkey" ? existing : undefined;
        // Cancellation must not cause a second prompt during rollback. Keep the
        // pending credential for cleanup/reconciliation on the next explicit attempt.
        if (error instanceof PasskeyError && ["canceled", "locked", "interaction-required", "verification-unavailable"].includes(error.code)) throw error;
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
