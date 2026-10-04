import type {IdAccountInfo, IdAuthDevice, IdLoginLogPage} from "../models/id/account";

export const MOCK_ID_ACCOUNT_INFO: IdAccountInfo = {
    userId: "8888",
    username: "demo",
    fullName: "张三",
    emailName: "demo",
    deptString: "计算机系",
    phone: "",
    lastPasswordChangedAt: null,
};

export const MOCK_ID_AUTH_DEVICES: IdAuthDevice[] = [{
    id: "demo-device",
    name: "THU Info APP",
    createdAt: "2026-01-01 10:00:00",
    updatedAt: "2026-01-02 10:00:00",
}];

export const MOCK_ID_LOGIN_LOGS: IdLoginLogPage = {
    items: [{
        loginTime: "2026-01-02 10:00:00",
        ipAddress: "192.0.2.1",
        appName: "WebVPN",
        targetAppName: null,
        isSingleSignOn: false,
    }, {
        loginTime: "2026-01-01 10:00:00",
        ipAddress: "192.0.2.1",
        appName: "WebVPN",
        targetAppName: "信息门户",
        isSingleSignOn: true,
    }],
    total: 2,
};
