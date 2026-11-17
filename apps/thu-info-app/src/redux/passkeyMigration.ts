import type {AuthState} from "./slices/auth";
import {LEGACY_PASSKEY_RP_ID} from "@thu-info/lib/src/lib/passkeyMigration";

export const needsPasskeyRenewal = (auth: AuthState, userId = auth.userId): boolean => {
	const credential = auth.passkeys[userId];
	return !!credential && (credential.rpId === LEGACY_PASSKEY_RP_ID || !!auth.passkeyRenewalRequired?.[userId]);
};
