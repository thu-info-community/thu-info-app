export interface UserInfo {
    /** Student / staff ID, e.g. "2026000000" */
    userId: string;
    /** Account name, which is also the local part of the mails address */
    username: string;
    /** Real name. Exposed as `fullName` for backwards compatibility. */
    fullName: string;
    /** Kept for backwards compatibility; identical to `username`. */
    emailName: string;
    /** Department name, e.g. "计算机系" */
    deptString: string;
    /** Phone number bound to the account */
    phone: string;
}
