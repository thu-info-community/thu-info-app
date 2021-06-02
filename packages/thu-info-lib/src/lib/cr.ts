import {InfoHelper} from "../index";
import {CR_CAPTCHA_URL, CR_LOGIN_HOME_URL, CR_LOGIN_SUBMIT_URL} from "../constants/strings";
import {uFetch} from "../utils/network";

export const getCaptchaUrl = async () => {
    await uFetch(CR_LOGIN_HOME_URL);
    return CR_CAPTCHA_URL;
};

export const loginCr = async (helper: InfoHelper, captcha: string) => {
    const res = await uFetch(CR_LOGIN_SUBMIT_URL, CR_LOGIN_HOME_URL, {
        j_username: helper.emailName,
        j_password: helper.password,
        captchaflag: "login1",
        _login_image_: captcha.toUpperCase(),
    });
    if (!res.includes("本科生选课")) {
        throw new Error("Failed to login to course registration.");
    }
};
