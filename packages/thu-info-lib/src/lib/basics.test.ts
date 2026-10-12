import dayjs from "dayjs";
import {describe, test, expect} from "@jest/globals";
import {__parseCalendarDataForTest as parseCalendarData, __parseUserInfoForTest as parseUserInfo} from "./basics";
import {UserInfoError} from "../utils/error";

const make = (kssj: string) => parseCalendarData({
    kssj,
    jssj: dayjs(kssj).add(120, "day").format("YYYY-MM-DD"),
    id: "x",
    xnxqmc: "test",
});

describe("parseCalendarData firstDay alignment", () => {
    test("Monday stays", () => {
        expect(make("2026-02-23").firstDay).toBe("2026-02-23");
    });
    test("Tuesday moves back", () => {
        expect(make("2026-02-24").firstDay).toBe("2026-02-23");
    });
    test("Wednesday moves back", () => {
        expect(make("2026-02-25").firstDay).toBe("2026-02-23");
    });
    test("Thursday moves back", () => {
        expect(make("2026-02-26").firstDay).toBe("2026-02-23");
    });
    test("Friday moves back", () => {
        expect(make("2026-02-27").firstDay).toBe("2026-02-23");
    });
    test("Saturday moves forward", () => {
        expect(make("2026-02-28").firstDay).toBe("2026-03-02");
    });
    test("Sunday moves forward", () => {
        expect(make("2026-03-01").firstDay).toBe("2026-03-02");
    });
});

describe("parseCalendarData weekCount uses aligned firstDay", () => {
    test("Start mid-week counts full weeks from Monday", () => {
        const {firstDay, weekCount} = make("2026-02-27"); // Friday, aligns to 2026-02-23
        expect(firstDay).toBe("2026-02-23");
        expect(weekCount).toBe(dayjs("2026-06-27").diff(dayjs(firstDay), "week") + 1);
    });
});

// Structure copied from the live account settings page; all values are synthetic.
const AUTHENTICATED_SETTINGS_HTML = `
<script> $.extend(uidm, {"availableLocales":null,"baseUrl":"","requestUrl":"/f/account/settings","locale":"zh_CN","authenticated":true,"accountMenu":{"userId":"2026000000","userRealName":"张三","settings":true,"changePassword":true}}); </script>
<script> $.extend(uidm, {"ss": {"account": {"userId":"2026000000","username":"zhangsan","realName":"张三","deptString":"计算机系","generateUsername":null,"lastUpdate":1787541134000,"weakAsOf":null,"phone":"13800000000","isFollowing":false,"followerWechatId":null,"trustDevicesNumStr":"5","smrz":false}, "props": {"pwdAlertThresholdInDays":90}}, "now": 1790733772292});
        console.log("uidm = ",uidm);
</script>`;

const UNAUTHENTICATED_LOGIN_HTML = `
<script> $.extend(uidm, {"availableLocales":[],"baseUrl":"","requestUrl":"/f/login","locale":"zh_CN","authenticated":false,"accountMenu":null}); </script>
<script> $.extend(uidm, {"ss": {"props": {"pwdAlertThresholdInDays":90}}, "now": 1790733772292}); </script>`;

describe("parseUserInfo", () => {
    test("extracts identity from the account settings page", () => {
        expect(parseUserInfo(AUTHENTICATED_SETTINGS_HTML)).toEqual({
            userId: "2026000000",
            username: "zhangsan",
            fullName: "张三",
            emailName: "zhangsan",
            deptString: "计算机系",
            phone: "13800000000",
        });
    });
    test("throws on the unauthenticated login page", () => {
        expect(() => parseUserInfo(UNAUTHENTICATED_LOGIN_HTML)).toThrow(UserInfoError);
    });
    test("throws when username is null rather than absent", () => {
        expect(() => parseUserInfo(`
$.extend(uidm, {"ss": {"account": {"userId":"2026000000","username":null,"realName":"张三","deptString":null,"phone":null}}});
`)).toThrow(UserInfoError);
    });
    test("throws when username is an empty string", () => {
        expect(() => parseUserInfo(`
$.extend(uidm, {"ss": {"account": {"userId":"2026000000","username":"","realName":"张三"}}});
`)).toThrow(UserInfoError);
    });
    test("tolerates missing optional fields", () => {
        expect(parseUserInfo(`
$.extend(uidm, {"ss": {"account": {"userId":"2026000000","username":"zhangsan","realName":"张三"}}});
`)).toEqual({
            userId: "2026000000",
            username: "zhangsan",
            fullName: "张三",
            emailName: "zhangsan",
            deptString: "",
            phone: "",
        });
    });
});
