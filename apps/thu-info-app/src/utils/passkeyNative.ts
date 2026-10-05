import NativePasskey from "rtn-passkey";
import {Platform} from "react-native";
import type {PasskeyAuthenticator, PasskeyKey, PasskeyAssertion} from "@thu-info/lib";
import {PasskeyError} from "@thu-info/lib/src/utils/error";

export const passkeyAvailable = NativePasskey !== null;
export type PasskeyVerificationAvailability = "available" | "not-configured" | "unsupported" | "unknown";

export const getPasskeyVerificationAvailability = async (): Promise<PasskeyVerificationAvailability> => {
    try {
        const value = JSON.parse(await module().getCapabilities()).verificationAvailability;
        return ["available", "not-configured", "unsupported"].includes(value) ? value : "unknown";
    } catch { return "unknown"; }
};

export const getPasskeyRootHint = async (): Promise<boolean> => {
    if (Platform.OS !== "android" || !NativePasskey) return false;
    try {
        const capabilities = JSON.parse(await NativePasskey.getCapabilities());
        return capabilities?.rootDetected === true;
    } catch {
        return false;
    }
};

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
    if (key.authenticationMode !== undefined && !["required", "silent"].includes(key.authenticationMode)) {
        throw new PasskeyError("invalid", "Passkey 数据无效，请重新设置。");
    }
    return {...key, authenticationMode: key.authenticationMode ?? "silent"};
};

const nativeError = (error: unknown): PasskeyError => {
    const failure = error as {code?: string; message?: string};
    const nativeCode = typeof failure.code === "string" && failure.code.startsWith("PASSKEY_") ?
        failure.code : failure.message?.match(/PASSKEY_[A-Z_]+/)?.[0];
    const codes: Record<string, [string, string]> = {
        PASSKEY_LOCKED: ["locked", "请解锁后再试。"],
        PASSKEY_CANCELED: ["canceled", "登录已取消。"],
        PASSKEY_INTERACTION_REQUIRED: ["interaction-required", "请打开应用完成登录。"],
        PASSKEY_AUTH_UNAVAILABLE: ["verification-unavailable", "此设备暂时无法完成验证，请设置锁屏密码或开启静默 Passkey 登录。"],
        PASSKEY_KEY_INVALIDATED: ["missing", "此设备的 Passkey 不可用，请重新设置。"],
    };
    const [code, message] = codes[nativeCode ?? ""] ?? ["unavailable", "Passkey 暂不可用，请稍后重试。"];
    return new PasskeyError(code, message);
};
const readCredential = async (keyId: string): Promise<PasskeyKey | null> => {
    let raw: string;
    try { raw = await module().getCredential(keyId); }
    catch (error) { throw nativeError(error); }
    return parseKey(raw);
};

export const createPasskeyAuthenticator = (isAppLocked: () => boolean,
    waitForInteraction: (keyId: string) => Promise<void> = async () => {}): PasskeyAuthenticator => ({
    async createCredential(options = {}) {
        if (isAppLocked()) throw new PasskeyError("locked", "请解锁后再试。");
        const mode = options.authenticationMode ?? "required";
        let raw: string;
        try { raw = await module().createCredential(mode); }
        catch (error) { throw nativeError(error); }
        const key = parseKey(raw);
        if (!key) throw new PasskeyError("unavailable", "此设备暂不支持 Passkey。");
        if (key.authenticationMode !== mode) {
            await module().deleteCredential(key.keyId).catch(() => undefined);
            throw new PasskeyError("invalid", "Passkey 设置未完成，请重新设置。");
        }
        return key;
    },
    getCredential: readCredential,
    async prepareAssertion(keyId) {
        const key = await readCredential(keyId);
        if (key?.authenticationMode === "required") await waitForInteraction(keyId);
        if (isAppLocked()) throw new PasskeyError("locked", "请解锁后再试。");
    },
    async signAssertion(keyId, challenge) {
        if (isAppLocked()) throw new PasskeyError("locked", "请解锁后再试。");
        let raw: string;
        try { raw = await module().signAssertion(keyId, challenge); }
        catch (error) { throw nativeError(error); }
        if (isAppLocked()) throw new PasskeyError("locked", "请解锁后再试。");
        const assertion: PasskeyAssertion = JSON.parse(raw);
        if (![assertion.clientDataJSON, assertion.authenticatorData, assertion.signature].every((value) => typeof value === "string" && /^[\w-]+$/.test(value))) {
            throw new PasskeyError("invalid", "Passkey 登录未成功，请重试。");
        }
        return assertion;
    },
    async deleteCredential(keyId) { await module().deleteCredential(keyId); },
});
