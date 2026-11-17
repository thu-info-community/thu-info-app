import {beforeEach, expect, jest, test} from "@jest/globals";
import {createHash} from "crypto";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {authenticatePasskey, base64url, fromBase64url, preparePasskey, registerPasskey, registrationResponse, renamePasskey} from "./passkey";
import type {PasskeyCredential, PasskeyAssertion} from "../models/id/passkey";
import {PasskeyError} from "../utils/error";
import {withLegacyPasskeyMigration} from "./passkeyMigration";

jest.mock("../utils/network", () => ({uFetch: jest.fn(), clearCookies: jest.fn(), getRedirectUrl: jest.fn()}));
const bytes = (value: number) => base64url(Buffer.alloc(32, value));
const credential: PasskeyCredential = {
    keyId: "local-key", credentialId: bytes(1), publicKeyX: bytes(2), publicKeyY: bytes(3), protectionLevel: "unknown",
    userId: "2026000000", userHandle: bytes(4), rpId: "id.tsinghua.edu.cn", authenticationMode: "required",
};
const options = {rp: {id: credential.rpId}, user: {id: credential.userHandle}, challenge: bytes(5), attestation: "none", pubKeyCredParams: [{alg: -7}]};
const nativeVerification = (rpId: string, challenge = options.challenge, flags = 0x05): PasskeyAssertion => ({
    clientDataJSON: base64url(Buffer.from(JSON.stringify({type: "webauthn.get", origin: "https://id.tsinghua.edu.cn", challenge}))),
    authenticatorData: base64url(Buffer.concat([createHash("sha256").update(rpId).digest(), Buffer.from([flags]), Buffer.alloc(4)])),
    signature: bytes(6),
});
const makeHelper = () => {
    const helper = new InfoHelper();
    helper.userId = credential.userId;
    helper.passkeyCredential = credential;
    helper.passkeyAuthenticator = {
        createCredential: jest.fn(async () => credential),
        getCredential: jest.fn(async () => credential),
        signAssertion: jest.fn(async () => ({clientDataJSON: bytes(6), authenticatorData: bytes(7), signature: bytes(8)})),
        signLegacyAssertionForMigration: jest.fn(async () => nativeVerification("tsinghua.edu.cn")),
        deleteCredential: jest.fn(async () => undefined),
    };
    return helper;
};
beforeEach(() => { jest.clearAllMocks(); });

test("registration binds origin, challenge, RP hash and public key without an attestation certificate", () => {
    const response = registrationResponse(credential, options);
    expect(JSON.parse(fromBase64url(response.response.clientDataJSON).toString())).toEqual({
        type: "webauthn.create", challenge: options.challenge, origin: "https://id.tsinghua.edu.cn", crossOrigin: false,
    });
    const attestation = fromBase64url(response.response.attestationObject);
    const rpHash = createHash("sha256").update(credential.rpId).digest();
    const offset = attestation.indexOf(rpHash);
    expect(offset).toBeGreaterThan(0);
    expect(attestation[offset + 32]).toBe(0x45); // UP + UV + AT under the app's verification policy.
    expect(attestation.subarray(offset + 37, offset + 53)).toEqual(Buffer.alloc(16));
    expect(attestation.includes(Buffer.from("none"))).toBe(true);
    expect(attestation.includes(fromBase64url(credential.credentialId))).toBe(true);
    expect(attestation.includes(fromBase64url(credential.publicKeyX))).toBe(true);
});

test.each([
    {...options, rp: {id: "other.example"}}, {...options, attestation: "direct"},
    {...options, pubKeyCredParams: [{alg: -257}]},
    {...options, rp: {id: "tsinghua.edu.cn"}},
])("rejects unsupported registration policy before generating a native key", async (policy) => {
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify(policy));
    const helper = makeHelper();
    await expect(preparePasskey(helper)).rejects.toMatchObject({code: "unsupported"});
    expect(helper.passkeyAuthenticator!.createCredential).not.toHaveBeenCalled();
});

test("a fresh registration challenge must still belong to the recorded account", async () => {
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify({...options, user: {id: bytes(9)}}));
    await expect(registerPasskey(makeHelper(), credential)).rejects.toMatchObject({code: "invalid"});
    expect(uFetch).toHaveBeenCalledTimes(1);
});

test.each(["revoked", "foreign-rp"])("does not sign when login policy is %s", async (policy) => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify({result: "success", object: {
        rpId: policy === "foreign-rp" ? "other.example" : credential.rpId, challenge: options.challenge,
        userVerification: "preferred", allowCredentials: [{id: bytes(9)}],
    }}));
    await expect(authenticatePasskey(helper)).rejects.toHaveProperty("code");
    expect(helper.passkeyAuthenticator!.signAssertion).not.toHaveBeenCalled();
});

test("a protected native key satisfies required verification for id.", async () => {
    const rpId = "id.tsinghua.edu.cn";
    const helper = makeHelper();
    helper.passkeyCredential = {...credential, rpId};
    jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValueOnce({...credential, rpId});
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        rpId, challenge: options.challenge, userVerification: "required", allowCredentials: [{id: credential.credentialId}],
    }})).mockResolvedValueOnce(JSON.stringify({ok: true, username: credential.userId}));
    await expect(authenticatePasskey(helper)).resolves.toBe(credential.userId);
    expect(helper.passkeyAuthenticator!.signAssertion).toHaveBeenCalledWith(credential.keyId, options.challenge);
    expect(jest.mocked(uFetch).mock.calls[0][0]).toBe("https://id.tsinghua.edu.cn/api/webauthn/login/options");
});

test("normal login always requests an unscoped challenge and submits the selected local credential", async () => {
    const helper = makeHelper();
    const selected = {...credential, keyId: "other-key", credentialId: bytes(9), userHandle: bytes(10), userId: "2026000001"};
    helper.userId = selected.userId;
    helper.passkeyCredential = selected;
    jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValue(selected);
    const loginOptions = {rpId: selected.rpId, userVerification: "required", allowCredentials: []};
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        ...loginOptions, challenge: options.challenge,
    }})).mockResolvedValueOnce(JSON.stringify({ok: true, username: selected.userId}))
        .mockResolvedValueOnce(JSON.stringify({result: "success", object: {
            ...loginOptions, challenge: bytes(8),
        }})).mockResolvedValueOnce(JSON.stringify({ok: true, username: selected.userId}));
    await expect(authenticatePasskey(helper)).resolves.toBe(selected.userId);
    await expect(authenticatePasskey(helper)).resolves.toBe(selected.userId);
    const calls = jest.mocked(uFetch).mock.calls;
    expect(calls.map(([url]) => url)).toEqual([
        "https://id.tsinghua.edu.cn/api/webauthn/login/options",
        "https://id.tsinghua.edu.cn/api/webauthn/login/verify",
        "https://id.tsinghua.edu.cn/api/webauthn/login/options",
        "https://id.tsinghua.edu.cn/api/webauthn/login/verify",
    ]);
    for (const index of [1, 3]) {
        expect(JSON.parse(calls[index][1] as string)).toMatchObject({
            username: selected.userId, id: selected.credentialId, rawId: selected.credentialId,
            response: {userHandle: selected.userHandle},
        });
    }
    expect(helper.passkeyAuthenticator!.signAssertion).toHaveBeenNthCalledWith(1, selected.keyId, options.challenge);
    expect(helper.passkeyAuthenticator!.signAssertion).toHaveBeenNthCalledWith(2, selected.keyId, bytes(8));
});

test.each(["tsinghua.edu.cn", "other.example", undefined])("an unscoped challenge for RP %s fails without retrying or signing", async (rpId) => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify({result: "success", object: {
        rpId, challenge: options.challenge, userVerification: "required", allowCredentials: [],
    }}));
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "unsupported"});
    expect(uFetch).toHaveBeenCalledTimes(1);
    expect(jest.mocked(uFetch).mock.calls[0][0]).toBe("https://id.tsinghua.edu.cn/api/webauthn/login/options");
    expect(helper.passkeyAuthenticator!.signAssertion).not.toHaveBeenCalled();
    expect(helper.passkeyAuthenticator!.signLegacyAssertionForMigration).not.toHaveBeenCalled();
    expect(helper.passkeyCredential).toBe(credential);
});

test.each([
    null, {result: "error"}, {result: "success", object: null},
    {result: "success", object: {rpId: credential.rpId}},
])("an invalid unscoped options response fails before signing", async (response) => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify(response));
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "unsupported"});
    expect(uFetch).toHaveBeenCalledTimes(1);
    expect(helper.passkeyAuthenticator!.signAssertion).not.toHaveBeenCalled();
});

test("an invalid unscoped challenge fails before signing", async () => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify({result: "success", object: {
        rpId: credential.rpId, challenge: "invalid!",
    }}));
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "invalid"});
    expect(uFetch).toHaveBeenCalledTimes(1);
    expect(helper.passkeyAuthenticator!.signAssertion).not.toHaveBeenCalled();
});

test("normal login refuses a v3.20.0 credential before requesting a challenge", async () => {
    const helper = makeHelper();
    helper.passkeyCredential = {...credential, rpId: "tsinghua.edu.cn"};
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "migration-required"});
    expect(helper.passkeyAuthenticator!.signAssertion).not.toHaveBeenCalled();
    expect(uFetch).not.toHaveBeenCalled();
});

test("the native RP binding must match the selected credential before requesting a challenge", async () => {
    const helper = makeHelper();
    jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValueOnce({...credential, rpId: undefined});
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "missing"});
    expect(uFetch).not.toHaveBeenCalled();
});

test.each([
    ["required", "required"], ["required", "preferred"], ["required", undefined],
    ["silent", "required"], ["silent", "preferred"], ["silent", undefined],
] as const)("%s enrollment declares application UV under school policy %s without an extra signing prompt", async (mode, userVerification) => {
    const rpId = "id.tsinghua.edu.cn";
    const enrollment = {...options, authenticatorSelection: {userVerification}};
    const helper = makeHelper();
    const key = {...credential, authenticationMode: mode};
    helper.passkeyAuthenticator!.prepareAssertion = jest.fn(async () => undefined);
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify(enrollment));
    jest.mocked(helper.passkeyAuthenticator!.createCredential).mockResolvedValueOnce(key);
    const prepared = await preparePasskey(helper, {authenticationMode: mode});
    expect(prepared.rpId).toBe(rpId);
    expect(prepared.authenticationMode).toBe(mode);
    expect(helper.passkeyAuthenticator!.createCredential).toHaveBeenCalledWith({authenticationMode: mode});
    jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValueOnce(key);
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify(enrollment)).mockResolvedValueOnce(JSON.stringify({ok: true}));
    await registerPasskey(helper, prepared);
    const calls = jest.mocked(uFetch).mock.calls;
    const posted = JSON.parse(calls[calls.length - 1][1] as string);
    const attestation = fromBase64url(posted.response.attestationObject);
    const offset = attestation.indexOf(createHash("sha256").update(rpId).digest());
    expect(offset).toBeGreaterThan(0);
    expect(attestation[offset + 32]).toBe(0x45);
    expect(helper.passkeyAuthenticator!.prepareAssertion).not.toHaveBeenCalled();
    expect(helper.passkeyAuthenticator!.signAssertion).not.toHaveBeenCalled();
});

test("a legacy native implementation cannot silently create a key for the new RP", async () => {
    const helper = makeHelper();
    jest.mocked(helper.passkeyAuthenticator!.createCredential).mockResolvedValueOnce({...credential, rpId: undefined});
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify({...options, rp: {id: "id.tsinghua.edu.cn"}}));
    await expect(preparePasskey(helper)).rejects.toMatchObject({code: "rp-changed"});
    expect(helper.passkeyAuthenticator!.deleteCredential).toHaveBeenCalledWith(credential.keyId);
});

test.each([null, {...credential, rpId: "tsinghua.edu.cn"}, {...credential, publicKeyX: bytes(9)}])("registration still requires a matching native key", async (key) => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify({...options, authenticatorSelection: {userVerification: "required"}}));
    jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValueOnce(key);
    await expect(registerPasskey(helper, credential)).rejects.toMatchObject({code: "missing"});
    expect(uFetch).toHaveBeenCalledTimes(1);
});

test("switching accounts while checking the registration key cancels before posting", async () => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify(options));
    jest.mocked(helper.passkeyAuthenticator!.getCredential).mockImplementationOnce(async () => {
        helper.userId = "2026000001";
        return credential;
    });
    await expect(registerPasskey(helper, credential)).rejects.toMatchObject({code: "canceled"});
    expect(uFetch).toHaveBeenCalledTimes(1);
});

test.each(["required", "preferred", undefined])("school policy %s does not override a silent native key", async (userVerification) => {
    const helper = makeHelper();
    jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValueOnce({...credential, authenticationMode: "silent"});
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        rpId: credential.rpId, challenge: options.challenge, userVerification, allowCredentials: [],
    }})).mockResolvedValueOnce(JSON.stringify({ok: true, username: credential.userId}));
    await expect(authenticatePasskey(helper)).resolves.toBe(credential.userId);
    expect(helper.passkeyAuthenticator!.signAssertion).toHaveBeenCalledWith(credential.keyId, options.challenge);
    expect(uFetch).toHaveBeenCalledTimes(2);
});

test("requires the matching native key and verified account before completing the ID form", async () => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        rpId: credential.rpId, challenge: options.challenge, userVerification: "preferred", allowCredentials: [],
    }})).mockResolvedValueOnce(JSON.stringify({ok: true, username: "2026000001"}));
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "invalid"});
    expect(helper.passkeyAuthenticator!.signAssertion).toHaveBeenCalledWith(credential.keyId, options.challenge);
    jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValueOnce(null);
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "missing"});
    expect(uFetch).toHaveBeenCalledTimes(2);
});

test("successful passwordless verification returns only the account identifier", async () => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        rpId: credential.rpId, challenge: options.challenge, userVerification: "preferred", allowCredentials: [],
    }})).mockResolvedValueOnce(JSON.stringify({ok: true, username: credential.userId}));
    expect(await authenticatePasskey(helper)).toBe(credential.userId);
    expect(helper.password).toBe("");
});

test.each([
    ["签名校验失败:Malicious counter value is detected. Cloned authenticators exist in parallel.", "counter-mismatch"],
    ["Signature validation failed", "revoked"],
    [undefined, "revoked"],
])("verification rejection %s is classified without retrying or deleting the credential", async (msg, code) => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        rpId: credential.rpId, challenge: options.challenge, userVerification: "required", allowCredentials: [],
    }})).mockResolvedValueOnce(JSON.stringify({ok: false, msg}));
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code});
    expect(uFetch).toHaveBeenCalledTimes(2);
    expect(helper.passkeyAuthenticator!.signAssertion).toHaveBeenCalledTimes(1);
    expect(helper.passkeyAuthenticator!.deleteCredential).not.toHaveBeenCalled();
    expect(helper.passkeyCredential).toBe(credential);
});

test("sets a device-specific name through the school's rename endpoint", async () => {
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify({ok: true}));
    await renamePasskey(makeHelper(), credential, "THU Info APP (Pixel 9)");
    expect(uFetch).toHaveBeenCalledWith(expect.stringContaining("/api/webauthn/enrollment/"),
        JSON.stringify({name: "THU Info APP (Pixel 9)"}), 30000, "UTF-8", true, "application/json", "PUT");
});

test.each([undefined, "silent"] as const)("enrollment forwards policy %s with verified keys as the default", async (mode) => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify(options));
    await preparePasskey(helper, {authenticationMode: mode});
    expect(helper.passkeyAuthenticator!.createCredential).toHaveBeenCalledWith({authenticationMode: mode ?? "required"});
});

test.each(["required", "silent"] as const)("only the scoped migration entry signs v3.20.0 %s native metadata with no RP", async (mode) => {
    const helper = makeHelper();
    const legacy = {...credential, rpId: "tsinghua.edu.cn", authenticationMode: mode};
    helper.passkeyCredential = legacy;
    jest.mocked(helper.passkeyAuthenticator!.getCredential).mockResolvedValue({...legacy, rpId: undefined});
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        rpId: legacy.rpId, challenge: options.challenge, userVerification: "required", allowCredentials: [{id: legacy.credentialId}],
    }})).mockResolvedValueOnce(JSON.stringify({ok: true, username: credential.userId}));
    await expect(withLegacyPasskeyMigration(helper, legacy, () => authenticatePasskey(helper))).resolves.toBe(credential.userId);
    expect(jest.mocked(uFetch).mock.calls[0][0]).toBe("https://id.tsinghua.edu.cn/api/webauthn/login/options?username=" +
        legacy.userId + "&credentialId=" + legacy.credentialId);
    expect(helper.passkeyAuthenticator!.signLegacyAssertionForMigration).toHaveBeenCalledTimes(1);
    expect(helper.passkeyAuthenticator!.signAssertion).not.toHaveBeenCalled();
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "migration-required"});
});

test("a failed migration cannot leave legacy signing enabled", async () => {
    const helper = makeHelper();
    const legacy = {...credential, rpId: "tsinghua.edu.cn"};
    helper.passkeyCredential = legacy;
    await expect(withLegacyPasskeyMigration(helper, legacy, async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "migration-required"});
});

test("the migration entry refuses a new native key even if the account metadata claims apex", async () => {
    const helper = makeHelper();
    const legacy = {...credential, rpId: "tsinghua.edu.cn"};
    helper.passkeyCredential = legacy;
    await expect(withLegacyPasskeyMigration(helper, legacy, () => authenticatePasskey(helper))).rejects.toMatchObject({code: "missing"});
    expect(helper.passkeyAuthenticator!.signLegacyAssertionForMigration).not.toHaveBeenCalled();
    expect(uFetch).not.toHaveBeenCalled();
});

test("switching accounts while fetching an unscoped challenge cancels before signing", async () => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockImplementationOnce(async () => {
        helper.userId = "2026000001";
        return JSON.stringify({result: "success", object: {rpId: credential.rpId, challenge: options.challenge}});
    });
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "canceled"});
    expect(uFetch).toHaveBeenCalledTimes(1);
    expect(helper.passkeyAuthenticator!.signAssertion).not.toHaveBeenCalled();
});
test("waits for interaction before fetching a challenge", async () => {
    const helper = makeHelper();
    let ready!: () => void;
    helper.passkeyAuthenticator!.prepareAssertion = jest.fn(() => new Promise<void>((resolve) => { ready = resolve; }));
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        rpId: credential.rpId, challenge: options.challenge, userVerification: "preferred", allowCredentials: [],
    }})).mockResolvedValueOnce(JSON.stringify({ok: true, username: credential.userId}));
    const result = authenticatePasskey(helper);
    await Promise.resolve();
    expect(uFetch).not.toHaveBeenCalled();
    ready();
    await expect(result).resolves.toBe(credential.userId);
});
test("canceling verification does not submit an assertion or erase the credential", async () => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        rpId: credential.rpId, challenge: options.challenge, userVerification: "preferred", allowCredentials: [],
    }}));
    jest.mocked(helper.passkeyAuthenticator!.signAssertion).mockRejectedValueOnce(new PasskeyError("canceled", "登录已取消。"));
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "canceled"});
    expect(uFetch).toHaveBeenCalledTimes(1);
    expect(helper.passkeyCredential).toBe(credential);
});
test("discarding a login during verification does not send its result to another account", async () => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValueOnce(JSON.stringify({result: "success", object: {
        rpId: credential.rpId, challenge: options.challenge, userVerification: "preferred", allowCredentials: [],
    }}));
    jest.mocked(helper.passkeyAuthenticator!.signAssertion).mockImplementationOnce(async () => {
        helper.userId = "2026000001";
        return {clientDataJSON: bytes(6), authenticatorData: bytes(7), signature: bytes(8)};
    });
    await expect(authenticatePasskey(helper)).rejects.toMatchObject({code: "canceled"});
    expect(uFetch).toHaveBeenCalledTimes(1);
});
test("a key created after logout is cleaned up without registering it", async () => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify(options));
    jest.mocked(helper.passkeyAuthenticator!.createCredential).mockImplementationOnce(async () => {
        helper.userId = "";
        return credential;
    });
    await expect(preparePasskey(helper)).rejects.toMatchObject({code: "canceled"});
    expect(helper.passkeyAuthenticator!.deleteCredential).toHaveBeenCalledWith(credential.keyId);
    expect(uFetch).toHaveBeenCalledTimes(1);
});
