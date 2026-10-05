import {beforeEach, expect, jest, test} from "@jest/globals";
import {createHash} from "crypto";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {authenticatePasskey, base64url, fromBase64url, preparePasskey, registerPasskey, registrationResponse, renamePasskey} from "./passkey";
import type {PasskeyCredential} from "../models/id/passkey";

jest.mock("../utils/network", () => ({uFetch: jest.fn(), clearCookies: jest.fn(), getRedirectUrl: jest.fn()}));
const bytes = (value: number) => base64url(Buffer.alloc(32, value));
const credential: PasskeyCredential = {
    keyId: "local-key", credentialId: bytes(1), publicKeyX: bytes(2), publicKeyY: bytes(3), protectionLevel: "unknown",
    userId: "2026000000", userHandle: bytes(4), rpId: "tsinghua.edu.cn",
};
const options = {rp: {id: credential.rpId}, user: {id: credential.userHandle}, challenge: bytes(5), attestation: "none", pubKeyCredParams: [{alg: -7}]};
const makeHelper = () => {
    const helper = new InfoHelper();
    helper.userId = credential.userId;
    helper.passkeyCredential = credential;
    helper.passkeyAuthenticator = {
        createCredential: jest.fn(async () => credential),
        getCredential: jest.fn(async () => credential),
        signAssertion: jest.fn(async () => ({clientDataJSON: bytes(6), authenticatorData: bytes(7), signature: bytes(8)})),
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
    expect(attestation[offset + 32]).toBe(0x41); // UP + AT, no assertion of real UV.
    expect(attestation.subarray(offset + 37, offset + 53)).toEqual(Buffer.alloc(16));
    expect(attestation.includes(Buffer.from("none"))).toBe(true);
    expect(attestation.includes(fromBase64url(credential.credentialId))).toBe(true);
    expect(attestation.includes(fromBase64url(credential.publicKeyX))).toBe(true);
});

test.each([
    {...options, rp: {id: "other.example"}}, {...options, attestation: "direct"},
    {...options, pubKeyCredParams: [{alg: -257}]}, {...options, authenticatorSelection: {userVerification: "required"}},
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

test.each(["revoked", "required", "foreign-rp"])("does not sign when login policy is %s", async (policy) => {
    const helper = makeHelper();
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify({result: "success", object: {
        rpId: policy === "foreign-rp" ? "other.example" : credential.rpId, challenge: options.challenge,
        userVerification: policy === "required" ? "required" : "preferred", allowCredentials: [{id: bytes(9)}],
    }}));
    await expect(authenticatePasskey(helper)).rejects.toHaveProperty("code");
    expect(helper.passkeyAuthenticator!.signAssertion).not.toHaveBeenCalled();
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

test("sets a device-specific name through the school's rename endpoint", async () => {
    jest.mocked(uFetch).mockResolvedValue(JSON.stringify({ok: true}));
    await renamePasskey(makeHelper(), credential, "THU Info APP (Pixel 9)");
    expect(uFetch).toHaveBeenCalledWith(expect.stringContaining("/api/webauthn/enrollment/"),
        JSON.stringify({name: "THU Info APP (Pixel 9)"}), 30000, "UTF-8", true, "application/json", "PUT");
});
