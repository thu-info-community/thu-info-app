import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {roamingWrapperWithMocks} from "./core";
import {
    APP_ANNOUNCEMENT_URL,
    APP_FEEDBACKS_URL,
    APP_LATEST_VERSION_URL,
    APP_PRIVACY_URL,
    APP_QRCODE_URL,
    APP_SUBMIT_FEEDBACK_URL,
} from "../constants/strings";
import {Announcement} from "../models/app/announcement";
import {Version} from "../models/app/version";
import {
    MOCK_APP_PRIVACY_URL,
    MOCK_FEEDBACK_REPLIES,
    MOCK_LATEST_ANNOUNCEMENTS,
    MOCK_LATEST_VERSION,
    MOCK_QRCODE_URL,
} from "../mocks/app";
import {Feedback} from "../models/app/feedback";

export const getLatestAnnounces = async (helper: InfoHelper): Promise<Announcement[]> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        () => uFetch(APP_ANNOUNCEMENT_URL).then(JSON.parse).then((r: any[]) => r.map((e) => ({
            id: e.id,
            content: e.content,
            createdAt: Date.parse(e.createdTime),
        }))),
        MOCK_LATEST_ANNOUNCEMENTS,
    );

export const getLatestVersion = async (helper: InfoHelper, platform: "ios" | "android"): Promise<Version> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        () => uFetch(`${APP_LATEST_VERSION_URL}/${platform}`).then(JSON.parse),
        MOCK_LATEST_VERSION,
    );

export const submitFeedback = async (
    helper: InfoHelper,
    content: string,
    appversion: string,
    os: string,
    nickname: string,
    contact: string,
    phonemodel: string,
): Promise<void> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    () => uFetch(
        APP_SUBMIT_FEEDBACK_URL,
        JSON.stringify({
            content,
            appversion,
            os,
            nickname,
            contact,
            phonemodel,
        }) as never as object,
        60000,
        "UTF-8",
        true,
        "application/json",
    ).then(() => {
    }),
    undefined,
);

export const getFeedbackReplies = async (helper: InfoHelper): Promise<Feedback[]> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        () => uFetch(APP_FEEDBACKS_URL).then(JSON.parse),
        MOCK_FEEDBACK_REPLIES,
    );

export const getWeChatGroupQRCodeContent = async (helper: InfoHelper): Promise<string> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        () => uFetch(APP_QRCODE_URL),
        MOCK_QRCODE_URL,
    );

export const getPrivacyUrl = (helper: InfoHelper): string => helper.mocked() ? MOCK_APP_PRIVACY_URL : APP_PRIVACY_URL;
