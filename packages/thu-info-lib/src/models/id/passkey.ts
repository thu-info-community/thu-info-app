export type PasskeyProtection = "strongbox" | "tee" | "hardware" | "software" | "unknown";
export type PasskeyAuthenticationMode = "required" | "silent";
export interface PasskeyCreationOptions {authenticationMode?: PasskeyAuthenticationMode}

export interface PasskeyKey {
    keyId: string;
    credentialId: string;
    publicKeyX: string;
    publicKeyY: string;
    protectionLevel: PasskeyProtection;
    /** Missing on legacy silent credentials. The native key policy remains authoritative. */
    authenticationMode?: PasskeyAuthenticationMode;
}

export interface PasskeyCredential extends PasskeyKey {
    userId: string;
    userHandle: string;
    rpId: string;
    name?: string;
}

export interface PasskeyAssertion {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
}

/** Private keys stay in the platform key service. All binary fields are base64url. */
export interface PasskeyAuthenticator {
    createCredential(options?: PasskeyCreationOptions): Promise<PasskeyKey>;
    /** Wait for user interaction before fetching a short-lived server challenge. */
    prepareAssertion?(keyId: string): Promise<void>;
    getCredential(keyId: string): Promise<PasskeyKey | null>;
    signAssertion(keyId: string, challenge: string): Promise<PasskeyAssertion>;
    deleteCredential(keyId: string): Promise<void>;
}

export interface PasskeyDevice {
    browser: string;
    os: string;
    deviceType: string;
    deviceModel: string;
    uaString: string;
    deviceId: string;
}
