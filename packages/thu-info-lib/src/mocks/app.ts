import {Announcement} from "../models/app/announcement";
import {Version} from "../models/app/version";
import {Feedback} from "../models/app/feedback";

export const MOCK_LATEST_ANNOUNCEMENTS: Announcement[] = [];

export const MOCK_LATEST_VERSION: Version = {
    versionName: "3.0.0",
    downloadUrl: "https://thuinfo.net",
    releaseNote: "-",
};

export const MOCK_FEEDBACK_REPLIES: Feedback[] = [];

export const MOCK_QRCODE_URL = "https://weixin.qq.com/g/AwYAAEjQ7zlUoO63koFrk9iKxPWNtu8iusBrcHoVLhRJomKY74_1YlEr5A9jMIBV";

export const MOCK_APP_PRIVACY_URL = "https://thuinfo.net/privacy";
