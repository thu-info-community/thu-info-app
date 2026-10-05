import {TurboModuleRegistry} from "react-native";
import type {TurboModule} from "react-native";

// JSON envelopes keep the binary/base64url contract compatible with both RN versions.
export interface Spec extends TurboModule {
    getCapabilities(): Promise<string>;
    createCredential(): Promise<string>;
    getCredential(keyId: string): Promise<string>;
    signAssertion(keyId: string, challenge: string): Promise<string>;
    deleteCredential(keyId: string): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>("RTNPasskey");
