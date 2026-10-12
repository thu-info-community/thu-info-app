import type {IdAccountInfo} from "../models/id/account";
import {UserInfoError} from "./error";

/** The settings page embeds a flat account object in `$.extend(uidm, ...)`. */
export const parseIdAccountInfo = (html: string): IdAccountInfo => {
    const match = /"account"\s*:\s*(\{[^}]*\})/.exec(html);
    if (!match) {
        throw new UserInfoError();
    }
    let account: Record<string, unknown>;
    try {
        account = JSON.parse(match[1]);
    } catch {
        throw new UserInfoError();
    }
    // A missing account distinguishes the login page. A nonempty username is
    // also required by existing consumers constructing campus email addresses.
    if (typeof account.username !== "string" || account.username === "" || typeof account.realName !== "string") {
        throw new UserInfoError();
    }
    return {
        userId: typeof account.userId === "string" ? account.userId : "",
        username: account.username,
        fullName: account.realName,
        emailName: account.username,
        deptString: typeof account.deptString === "string" ? account.deptString : "",
        phone: typeof account.phone === "string" ? account.phone : "",
        lastPasswordChangedAt: typeof account.lastUpdate === "number" && Number.isFinite(account.lastUpdate)
            ? account.lastUpdate : null,
    };
};
