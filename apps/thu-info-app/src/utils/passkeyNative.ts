import NativePasskey from "rtn-passkey";
import type {PasskeyAuthenticator, PasskeyKey, PasskeyAssertion} from "@thu-info/lib";
import {PasskeyError} from "@thu-info/lib/src/utils/error";

export const passkeyAvailable = NativePasskey !== null;

const module = () => {
    if (!NativePasskey) throw new PasskeyError("unavailable", "此设备暂不支持 Passkey。");
    return NativePasskey;
};
const parseKey = (raw: string): PasskeyKey | null => {
    const key = JSON.parse(raw);
    if (key === null) return null;
    for (const field of ["keyId", "credentialId", "publicKeyX", "publicKeyY", "protectionLevel"]) {
        if (typeof key[field] !== "string") throw new PasskeyError("invalid", "此设备的 Passkey 不可用，请重新设置。");
    }
    return key;
};

export const createPasskeyAuthenticator = (isAppLocked: () => boolean): PasskeyAuthenticator => ({
    async createCredential() {
        if (isAppLocked()) throw new PasskeyError("locked", "请解锁后再试。");
        const key = parseKey(await module().createCredential());
        if (!key) throw new PasskeyError("unavailable", "此设备暂不支持 Passkey。");
        return key;
    },
    async getCredential(keyId) { return parseKey(await module().getCredential(keyId)); },
    async signAssertion(keyId, challenge) {
        if (isAppLocked()) throw new PasskeyError("locked", "请解锁后再试。");
        let raw: string;
        try { raw = await module().signAssertion(keyId, challenge); }
        catch (error) {
            const code = (error as {code?: string}).code === "PASSKEY_LOCKED" ? "locked" : "missing";
            throw new PasskeyError(code, code === "locked" ? "请解锁后再试。" : "此设备的 Passkey 不可用，请重新设置。");
        }
        if (isAppLocked()) throw new PasskeyError("locked", "请解锁后再试。");
        const assertion: PasskeyAssertion = JSON.parse(raw);
        if (![assertion.clientDataJSON, assertion.authenticatorData, assertion.signature].every((value) => typeof value === "string" && /^[\w-]+$/.test(value))) {
            throw new PasskeyError("invalid", "Passkey 登录未成功，请重试。");
        }
        return assertion;
    },
    async deleteCredential(keyId) { await module().deleteCredential(keyId); },
});
