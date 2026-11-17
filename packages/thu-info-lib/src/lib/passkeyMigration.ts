import type {InfoHelper} from "../index";
import type {PasskeyCredential} from "../models/id/passkey";
import {PasskeyError} from "../utils/error";

// v3.20.0 is the only supported legacy format. Its native metadata has no RP.
export const LEGACY_PASSKEY_RP_ID = "tsinghua.edu.cn";
const migrations = new WeakMap<InfoHelper, PasskeyCredential>();

export const isLegacyPasskeyMigration = (helper: InfoHelper, credential: PasskeyCredential): boolean => {
    const selected = migrations.get(helper);
    return selected?.keyId === credential.keyId && selected.credentialId === credential.credentialId &&
        selected.userId === helper.userId && credential.rpId === LEGACY_PASSKEY_RP_ID;
};

export const withLegacyPasskeyMigration = async <T>(helper: InfoHelper, credential: PasskeyCredential,
    operation: () => Promise<T>): Promise<T> => {
    if (credential.rpId !== LEGACY_PASSKEY_RP_ID) throw new PasskeyError("invalid", "此凭据不需要旧版 Passkey 迁移。");
    if (migrations.has(helper)) throw new PasskeyError("busy", "正在更新 Passkey，请稍候。");
    migrations.set(helper, credential);
    try { return await operation(); }
    finally { migrations.delete(helper); }
};
