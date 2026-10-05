import {defaultAuth} from "./slices/auth";
import type {AuthState} from "./slices/auth";

export const sanitizeAuth = (auth: Partial<AuthState>): AuthState => {
    // Released password-only state has none of the Passkey fields.
    const state = {...defaultAuth, ...auth};
    const method = state.userId && state.passkeys[state.userId] ? "passkey" : "password";
    const silentPasskeyLogin = {...state.silentPasskeyLogin};
    for (const credential of Object.values(state.passkeys)) {
        silentPasskeyLogin[credential.userId] = credential.authenticationMode === "silent";
    }
    return {...state, fingerprint: state.fingerprint || defaultAuth.fingerprint, silentPasskeyLogin,
        authMethod: method, password: method === "passkey" ? "" : state.password};
};

interface Storage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<unknown>;
}

/** Run before redux-persist starts either root or nested hydration. Never log contents. */
export const migrateAuthStorage = async (rootStorage: Storage, protectedStorage: Storage) => {
    const raw = await rootStorage.getItem("persist:root");
    if (!raw) return;
    const root = JSON.parse(raw);
    for (const [slice, key] of [
        ["auth", "com.unidy2002.thuinfo.persist.auth.auth"],
        ["credentials", "com.unidy2002.thuinfo.persist.credentials.credentials"],
    ]) {
        if (root[slice] === undefined) continue;
        const existing = await protectedStorage.getItem(key);
        if (!existing) {
            const legacy = JSON.parse(root[slice]);
            const value = slice === "auth" ? sanitizeAuth(legacy) : legacy;
            await protectedStorage.setItem(key, JSON.stringify(Object.fromEntries(Object.entries(value).map(([field, item]) => [field, JSON.stringify(item)]))));
        }
        delete root[slice];
    }
    await rootStorage.setItem("persist:root", JSON.stringify(root));
};
