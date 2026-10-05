import {PasskeyError} from "@thu-info/lib/src/utils/error";

interface InteractionState {
    loggedInUserId: string;
    selectedUserId: string;
    keyId?: string;
    foreground: boolean;
    appLocked: boolean;
}

/** Wait before requesting a short-lived challenge; cancel if this login is replaced. */
export const waitForPasskeyInteraction = (keyId: string, readState: () => InteractionState,
    subscribe: (check: () => void) => () => void): Promise<void> => {
    const before = {...readState()};
    return new Promise((resolve, reject) => {
        let unsubscribe: (() => void) | undefined;
        let settled = false;
        const check = () => {
            if (settled) return;
            const state = readState();
            if (state.loggedInUserId !== before.loggedInUserId || state.selectedUserId !== before.selectedUserId || state.keyId !== keyId) {
                settled = true;
                unsubscribe?.();
                reject(new PasskeyError("canceled", "登录已取消。"));
            } else if (state.foreground && !state.appLocked) {
                settled = true;
                unsubscribe?.();
                resolve();
            }
        };
        unsubscribe = subscribe(check);
        if (settled) unsubscribe();
        else check();
    });
};
