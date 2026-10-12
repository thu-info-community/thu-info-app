import {Buffer} from "buffer";
import CryptoJS from "crypto-js";
import type {InfoHelper} from "../index";
import {ID_HOST_URL} from "../constants/strings";
import {uFetch} from "../utils/network";
import {PasskeyError} from "../utils/error";
import type {PasskeyCredential, PasskeyKey, PasskeyCreationOptions} from "../models/id/passkey";

export const PASSKEY_RP_ID = "tsinghua.edu.cn";
export const PASSKEY_ORIGIN = "https://id.tsinghua.edu.cn";

export const base64url = (bytes: Buffer): string => bytes.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const fromBase64url = (value: string): Buffer => {
    if (!/^[\w-]+$/.test(value)) throw new PasskeyError("invalid", "Passkey 数据无效，请重新设置。");
    const bytes = Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (base64url(bytes) !== value) throw new PasskeyError("invalid", "Passkey 数据无效，请重新设置。");
    return bytes;
};
const hash = (text: string): Buffer => Buffer.from(CryptoJS.SHA256(text).toString(), "hex");

const head = (major: number, value: number): Buffer => {
    if (value < 24) return Buffer.from([(major << 5) | value]);
    if (value < 256) return Buffer.from([(major << 5) | 24, value]);
    const bytes = Buffer.alloc(3);
    bytes[0] = (major << 5) | 25;
    bytes.writeUInt16BE(value, 1);
    return bytes;
};
// The registration format only needs bounded integers, byte/text strings and maps.
type Cbor = number | string | Buffer | Map<string | number, Cbor>;
const cbor = (value: Cbor): Buffer => {
    if (Buffer.isBuffer(value)) return Buffer.concat([head(2, value.length), value]);
    if (typeof value === "string") {
        const bytes = Buffer.from(value);
        return Buffer.concat([head(3, bytes.length), bytes]);
    }
    if (typeof value === "number") return value < 0 ? head(1, -1 - value) : head(0, value);
    return Buffer.concat([head(5, value.size), ...Array.from(value).flatMap(([key, item]) => [cbor(key), cbor(item)])]);
};

interface EnrollmentOptions {
    rp: {id: string};
    user: {id: string};
    challenge: string;
    attestation: string;
    pubKeyCredParams: {alg: number}[];
    authenticatorSelection?: {userVerification?: string};
}

const validateEnrollmentOptions = (options: EnrollmentOptions): void => {
    if (options.rp?.id !== PASSKEY_RP_ID || options.attestation !== "none" ||
        !options.pubKeyCredParams?.some((p) => p.alg === -7) || options.authenticatorSelection?.userVerification === "required" ||
        typeof options.user?.id !== "string") {
        throw new PasskeyError("unsupported", "学校当前的登录设置暂不支持此方式。");
    }
    fromBase64url(options.challenge);
    fromBase64url(options.user.id);
};

export const registrationResponse = (key: PasskeyKey, options: EnrollmentOptions) => {
    validateEnrollmentOptions(options);
    const x = fromBase64url(key.publicKeyX), y = fromBase64url(key.publicKeyY), id = fromBase64url(key.credentialId);
    if (x.length !== 32 || y.length !== 32 || id.length !== 32) throw new PasskeyError("invalid", "Passkey 数据无效，请重新设置。");
    const cose = cbor(new Map<number, Cbor>([[1, 2], [3, -7], [-1, 1], [-2, x], [-3, y]]));
    const length = Buffer.alloc(2); length.writeUInt16BE(id.length);
    // None attestation, zero AAGUID; registration has UP/AT and does not claim UV.
    const authData = Buffer.concat([hash(PASSKEY_RP_ID), Buffer.from([0x41]), Buffer.alloc(4), Buffer.alloc(16), length, id, cose]);
    const clientData = Buffer.from(JSON.stringify({type: "webauthn.create", challenge: options.challenge, origin: PASSKEY_ORIGIN, crossOrigin: false}));
    return {
        id: key.credentialId, rawId: key.credentialId, type: "public-key", transports: [],
        response: {
            clientDataJSON: base64url(clientData),
            attestationObject: base64url(cbor(new Map<string, Cbor>([["fmt", "none"], ["attStmt", new Map()], ["authData", authData]]))),
        },
    };
};

const device = (helper: InfoHelper) => helper.passkeyDevice ?? {
    browser: "THU Info", os: "", deviceType: "mobile", deviceModel: "", uaString: "THUInfo", deviceId: helper.fingerprint,
};
const getJson = async (path: string) => JSON.parse(await uFetch(ID_HOST_URL + path));
const postJson = async (path: string, body: unknown) => JSON.parse(await uFetch(ID_HOST_URL + path, JSON.stringify(body), 30000, "UTF-8", true, "application/json"));

export const listPasskeys = async (): Promise<{credentialId: string}[]> => {
    const response = await getJson("/api/webauthn/enrollment");
    if (response.ok !== true || !Array.isArray(response.devices) || response.devices.some((d: {credentialId?: string}) => typeof d.credentialId !== "string")) {
        throw new PasskeyError("session", "请登录后再设置 Passkey。");
    }
    return response.devices.map((d: {credentialId: string}) => ({credentialId: d.credentialId}));
};

/** Create metadata before POST so the caller can reconcile an interrupted registration. */
export const preparePasskey = async (helper: InfoHelper, creation: PasskeyCreationOptions = {}): Promise<PasskeyCredential> => {
    if (!helper.passkeyAuthenticator || !helper.userId) throw new PasskeyError("unavailable", "此设备暂不支持 Passkey。");
    const userId = helper.userId;
    const options: EnrollmentOptions = await getJson("/api/webauthn/enrollment/options");
    // Validate policy before creating a key.
    validateEnrollmentOptions(options);
    const name = await helper.trustFingerprintNameHook();
    if (helper.userId !== userId) throw new PasskeyError("canceled", "登录已取消。");
    const key = await helper.passkeyAuthenticator.createCredential({authenticationMode: creation.authenticationMode ?? "required"});
    if (helper.userId !== userId) {
        await helper.passkeyAuthenticator.deleteCredential(key.keyId).catch(() => undefined);
        throw new PasskeyError("canceled", "登录已取消。");
    }
    return {...key, userId, userHandle: options.user.id, rpId: PASSKEY_RP_ID, name};
};

export const registerPasskey = async (helper: InfoHelper, credential: PasskeyCredential): Promise<void> => {
    if (credential.userId !== helper.userId) throw new PasskeyError("invalid", "请使用同一账号设置 Passkey。");
    // Fetch a fresh challenge: generating or persisting the native key can take time.
    const options: EnrollmentOptions = await getJson("/api/webauthn/enrollment/options");
    if (options.user?.id !== credential.userHandle) throw new PasskeyError("invalid", "请使用同一账号设置 Passkey。");
    const result = await postJson("/api/webauthn/enrollment/verify", {...registrationResponse(credential, options), username: helper.userId, device: device(helper)});
    if (result.ok !== true) throw new PasskeyError("registration", "Passkey 未能开启，请稍后重试。");
};

export const removePasskey = async (credential: PasskeyCredential): Promise<void> => {
    const response = await uFetch(ID_HOST_URL + "/api/webauthn/enrollment/" + encodeURIComponent(credential.credentialId), undefined, 30000, "UTF-8", true, undefined, "DELETE");
    const result = JSON.parse(response);
    if (result.ok !== true) throw new PasskeyError("registration", "Passkey 未能删除，请稍后重试。");
};

export const renamePasskey = async (helper: InfoHelper, credential: PasskeyCredential, name: string): Promise<void> => {
    if (credential.userId !== helper.userId || !name.trim()) throw new PasskeyError("invalid", "请使用同一账号设置 Passkey。");
    const response = await uFetch(ID_HOST_URL + "/api/webauthn/enrollment/" + encodeURIComponent(credential.credentialId),
        JSON.stringify({name: name.trim()}), 30000, "UTF-8", true, "application/json", "PUT");
    if (JSON.parse(response).ok !== true) throw new PasskeyError("registration", "Passkey 名称未能更新，请稍后重试。");
};

/** Returns the account identifier used by the upstream SM2 completion form, never a password. */
export const authenticatePasskey = async (helper: InfoHelper): Promise<string> => {
    const credential = helper.passkeyCredential;
    if (!credential || credential.userId !== helper.userId || credential.rpId !== PASSKEY_RP_ID || !helper.passkeyAuthenticator) {
        throw new PasskeyError("unavailable", "此设备的 Passkey 不可用，请重新设置。");
    }
    const key = await helper.passkeyAuthenticator.getCredential(credential.keyId);
    if (!key || key.credentialId !== credential.credentialId || key.publicKeyX !== credential.publicKeyX || key.publicKeyY !== credential.publicKeyY) {
        throw new PasskeyError("missing", "此设备的 Passkey 不可用，请重新设置。");
    }
    const ensureCurrentAccount = () => {
        if (helper.passkeyCredential?.keyId !== credential.keyId ||
            helper.passkeyCredential?.credentialId !== credential.credentialId || helper.userId !== credential.userId) {
            throw new PasskeyError("canceled", "登录已取消。");
        }
    };
    await helper.passkeyAuthenticator.prepareAssertion?.(credential.keyId);
    ensureCurrentAccount();
    const result = await getJson("/api/webauthn/login/options?username=" + encodeURIComponent(helper.userId));
    const options = result.object;
    if (result.result !== "success" || options?.rpId !== PASSKEY_RP_ID || typeof options?.challenge !== "string" || options.userVerification === "required") {
        throw new PasskeyError("unsupported", "学校当前的登录设置暂不支持此方式。");
    }
    fromBase64url(options.challenge);
    if (!Array.isArray(options.allowCredentials) || (options.allowCredentials.length && !options.allowCredentials.some((c: {id: string}) => c.id === credential.credentialId))) {
        throw new PasskeyError("revoked", "此设备的 Passkey 已不可用，请重新设置。");
    }
    ensureCurrentAccount();
    const assertion = await helper.passkeyAuthenticator.signAssertion(credential.keyId, options.challenge);
    ensureCurrentAccount();
    const verified = await postJson("/api/webauthn/login/verify", {
        device: device(helper), username: helper.userId, id: credential.credentialId, rawId: credential.credentialId, type: "public-key",
        response: {...assertion, userHandle: credential.userHandle},
    });
    ensureCurrentAccount();
    if (verified.ok !== true) throw new PasskeyError("revoked", "Passkey 登录未成功，请重试或重新设置。");
    if (verified.username !== helper.userId) throw new PasskeyError("invalid", "登录账号不一致，请重新登录。");
    return verified.username;
};
