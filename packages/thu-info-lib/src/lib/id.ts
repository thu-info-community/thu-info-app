import type {InfoHelper} from "../index";
import {GET_DEVICE_LIST_URL, ID_ACCOUNT_SETTINGS_URL, ID_LOGIN_LOG_DATA_URL} from "../constants/strings";
import type {IdAccountInfo, IdAuthDevice, IdLoginLogPage} from "../models/id/account";
import {MOCK_ID_ACCOUNT_INFO, MOCK_ID_AUTH_DEVICES, MOCK_ID_LOGIN_LOGS} from "../mocks/id";
import {LibError} from "../utils/error";
import {parseIdAccountInfo} from "../utils/id-account";
import {uFetch} from "../utils/network";
import {roamingWrapperWithMocks} from "./core";

/** Keep session bootstrapping, but never save a new trusted device during a read. */
const readOnlyContext = (helper: InfoHelper): InfoHelper => {
    const context: InfoHelper = Object.assign(Object.create(Object.getPrototypeOf(helper)), helper);
    context.trustFingerprintHook = undefined;
    context.twoFactorAuthLimitHook = undefined;
    context.mocked = () => context.userId === context.MOCK && context.password === context.MOCK;
    // Preserve trustBrowser: switching it off would also disable reuse of the
    // existing fingerprint on the passwordless /security_check entry.
    return context;
};

const record = (value: unknown): Record<string, unknown> => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw new LibError("Invalid ID response.");
    }
    return value as Record<string, unknown>;
};

const text = (value: unknown): string => {
    if (value == null) {
        return "";
    }
    if (typeof value !== "string") {
        throw new LibError("Invalid ID field.");
    }
    return value;
};

export const parseIdAuthDevices = (response: string): IdAuthDevice[] => {
    const value = record(JSON.parse(response));
    if (value.result !== "success" || !Array.isArray(value.object)) {
        throw new LibError("Failed to read ID devices.");
    }
    return value.object.map((item) => {
        const device = record(item);
        const id = text(device.id);
        if (id === "") {
            throw new LibError("Invalid ID device.");
        }
        return {
            id,
            name: text(device.name),
            createdAt: text(device.createtime),
            updatedAt: text(device.updatetime),
        };
    });
};

export const parseIdLoginLogs = (response: string): IdLoginLogPage => {
    const value = record(JSON.parse(response));
    if (value.error || !Array.isArray(value.data) || typeof value.recordsTotal !== "number" ||
        !Number.isSafeInteger(value.recordsTotal) || value.recordsTotal < 0) {
        throw new LibError("Failed to read ID login logs.");
    }
    return {
        total: value.recordsTotal,
        items: value.data.map((item) => {
            const log = record(item);
            return {
                loginTime: text(log.logintime).replace(/\.\d+$/, ""),
                ipAddress: text(log.ipaddr),
                appName: text(log.appid),
                targetAppName: text(log.appid_next) || null,
                // The website treats any nonempty value as SSO, even "0".
                isSingleSignOn: log.single_sign_on != null && log.single_sign_on !== "",
            };
        }),
    };
};

export const getIdAccountInfo = async (helper: InfoHelper): Promise<IdAccountInfo> =>
    roamingWrapperWithMocks(
        readOnlyContext(helper), "id_website", "",
        async (html) => parseIdAccountInfo(html ?? await uFetch(ID_ACCOUNT_SETTINGS_URL)),
        {...MOCK_ID_ACCOUNT_INFO},
    );

export const getIdAuthDevices = async (helper: InfoHelper): Promise<IdAuthDevice[]> =>
    roamingWrapperWithMocks(
        readOnlyContext(helper), "id_website", "",
        // The upstream uses POST with an empty body for this read-only query.
        async () => parseIdAuthDevices(await uFetch(GET_DEVICE_LIST_URL, {})),
        MOCK_ID_AUTH_DEVICES.map((device) => ({...device})),
    );

export const getIdLoginLogs = async (helper: InfoHelper, page = 1): Promise<IdLoginLogPage> => {
    if (!Number.isSafeInteger(page) || page < 1) {
        throw new RangeError("Page must be a positive integer.");
    }
    return roamingWrapperWithMocks(
        readOnlyContext(helper), "id_website", "",
        // The server fixes the page size at 25. DataTables' draw is optional
        // and affects only its response counter, not the requested records.
        async () => parseIdLoginLogs(await uFetch(`${ID_LOGIN_LOG_DATA_URL}?page=${page}`)),
        {items: page === 1 ? MOCK_ID_LOGIN_LOGS.items.map((log) => ({...log})) : [], total: MOCK_ID_LOGIN_LOGS.total},
    );
};
