import {
    countdown,
    getAssessmentForm,
    getAssessmentList,
    getClassroomList,
    getClassroomState,
    getUserInfo,
    getPhysicalExamResult,
    getReport,
    postAssessmentForm,
    // getBankPayment,
    getCalendar,
    getInvoiceList,
    getInvoicePDF,
    switchLang,
    naiveSendMail,
    getCalendarImageUrl, getSchoolCalendarYear,
    getGraduateIncome,
    getBankPaymentParellize,
    getMadModelToken,
} from "./lib/basics";
import {forgetDevice, login, logout} from "./lib/core";
import {getDormScore, getElePayRecord, getEleRechargePayCode, getEleRemainder, resetDormPassword} from "./lib/dorm";
import {
    LibBookRecord,
    LibFuzzySearchResult,
    Library,
    LibraryFloor,
    LibrarySeat,
    LibrarySection,
    LibRoomBookRecord,
    LibRoomRes,
    SocketStatus,
} from "./models/home/library";
import {
    bookLibraryRoom,
    bookLibrarySeat,
    cancelBooking,
    cancelLibraryRoomBooking,
    fuzzySearchLibraryId,
    getBookingRecords,
    getLibraryFloorList,
    getLibraryList,
    getLibraryRoomBookingInfoList,
    getLibraryRoomBookingRecord,
    getLibraryRoomBookingResourceList,
    getLibrarySeatList,
    getLibrarySectionList,
    getAccNo,
    cabLogin,
    toggleSocketState,
    updateLibraryRoomEmail,
} from "./lib/library";
import {
    addNewsSubscription,
    addNewsToFavor,
    getFavorNewsList, getNewsChannelList,
    getNewsDetail,
    getNewsList, getNewsListBySubscription, getNewsSourceList, getNewsSubscriptionList,
    removeNewsFromFavor, removeNewsSubscription,
    searchNewsList,
} from "./lib/news";
import {getSchedule} from "./lib/schedule";
import {Course} from "./models/home/report";
import {Form} from "./models/home/assessment";
import {NewsSlice, NewsSubscription, ChannelTag} from "./models/news/news";
import {
    getSportsCaptchaUrlMethod,
    getSportsReservationRecords,
    getSportsResources,
    makeSportsReservation,
    paySportsReservation,
    unsubscribeSportsReservation,
    updateSportsPhoneNumber,
    ValidReceiptTypes,
} from "./lib/sports";
import {
    getCrTimetable,
    getCrCaptchaUrl,
    getCoursePlan,
    loginCr,
    searchCrRemaining,
    searchCrPrimaryOpen,
    searchCrCourses,
    getCrAvailableSemesters,
    selectCourse,
    Priority,
    deleteCourse,
    getSelectedCourses,
    changeCourseWill,
    searchCoursePriorityInformation,
    searchCoursePriorityMeta,
    getCrCurrentStage,
    getQueueInfo,
    cancelCoursePF,
    setCoursePF,
} from "./lib/cr";
import {CrTimetable, SearchCoursePriorityQuery, SearchParams} from "./models/cr/cr";
import {BankPaymentByMonth, GraduateIncome} from "./models/home/bank";
import {
    getNamespaces,
    getPersonalProjects,
    getProjectBranches,
    getProjectDetail,
    getProjectFileBlob,
    getProjectTree,
    getRecentProjects,
    getStarredProjects,
    renderMarkdown,
    searchProjects,
} from "./lib/gitlab";
import {CalendarData} from "./models/schedule/calendar";
import {bookDetail, downloadChapters, searchReservesLib} from "./lib/reserves-lib";
import {BookChapter} from "./models/home/reserves-lib";
import {Invoice} from "./models/home/invoice";
import {LoginError} from "./utils/error";
import {getDegreeProgramCompletion, getFullDegreeProgram} from "./lib/program";
import {Classroom, ClassroomStateResult} from "./models/home/classroom";
import {
    appStartupStat,
    appUsageStat,
    getFeedbackReplies,
    getLatestAnnounces,
    getLatestVersion,
    getPrivacyUrl,
    getWeChatGroupQRCodeContent,
    submitFeedback,
} from "./lib/app";
import {MOCK_LATEST_VERSION} from "./mocks/app";
import {
    getNetworkBalance,
    getNetworkAccountInfo,
    getNetworkVerificationImageUrl,
    getOnlineDevices,
    loginNetwork,
    logoutNetwork,
    loginUsereg,
} from "./lib/network";
import {getScoreByCourseId} from "./lib/thos";
import {
    canRechargeCampusCard,
    cardCancelLoss, cardChangeTransactionPassword,
    cardGetInfo,
    cardGetPhotoUrl,
    cardGetTransactions,
    cardLogin, cardModifyMaxTransactionAmount,
    cardRechargeFromBank, cardRechargeFromWechatAlipay,
    cardReportLoss,
} from "./lib/card";
import {CardTransactionType} from "./models/card/transaction";
import {CardRechargeType} from "./models/card/recharge";
import { Device } from "./models/network/device";
import { SportsReservationRecord } from "./models/home/sports";

export class InfoHelper {
    public userId = "";
    public password = "";
    public fingerprint = "";

    /**
     * Mock account and password.
     *
     * Due to various reasons, consumers of this library might hope to get
     * some fake data, without literally making a request to the school
     * website.
     *
     * We make this possible by creating an internal mocking account. The
     * default userId and password of this account are both "8888", while you
     * can change this behavior by modifying `helper.MOCK`.
     *
     * After you have logged in with the mocking account, almost every
     * operation will respond with a fake value.
     *
     * You can easily get whether the user is using a mocking account by
     * invoking `helper.mocked()`.
     */
    public MOCK = "8888";

    /**
     * We consider an account to be mocked if its userId and password are both "8888".
     */
    public mocked = () => this.userId === this.MOCK && this.password === this.MOCK;

    /**
     * Returns whether the user is graduate.
     *
     * We detect a user's graduation status through the fifth digit (index 4) of his/her student ID.
     *
     * That is, we think a user is graduate iff the fifth digit of his/her student ID is 2 or 3.
     */
    public graduate = () => this.userId.length > 4 ? (this.userId[4] === "2" || this.userId[4] === "3") : false;

    /**
     * Invoked before logging in.
     *
     * Override this value to customize.
     */
    public clearCookieHandler = async () => {
    };

    /**
     * Invoked when a login error occurs.
     *
     * Override this value to customize.
     */
    public loginErrorHook: ((e: LoginError) => any) | undefined = undefined;

    /**
     * Invoked when 2FA method selection is required.
     *
     * Override this value to customize.
     */
    public twoFactorMethodHook: ((hasWeChatBool: boolean, phone: string | null, hasTotp: boolean) => Promise<"wechat" | "mobile" | "totp" | undefined>) | undefined = undefined;

    /**
     * Invoked when 2FA is required.
     *
     * Override this value to customize.
     */
    public twoFactorAuthHook: (() => Promise<string | undefined>) | undefined = undefined;

    /**
     * Invoked when 2FA over limit is detected.
     *
     * Override this value to customize.
     */
    public twoFactorAuthLimitHook: (() => Promise<void>) | undefined = undefined;

    /**
     * Invoked when it has to be decided whether to trust the current fingerprint.
     *
     * Override this value to customize.
     */
    public trustFingerprintHook: (() => Promise<boolean>) | undefined = undefined;

    /**
     * Invoked to get a trusted device name for the fingerprint.
     *
     * Override this value to customize.
     */
    public trustFingerprintNameHook: (() => Promise<string>) = async () => "THU Info Lib";

    /**
     * Login with userId and password.
     */
    public login = async (
        auth: {
            userId?: string;
            password?: string;
        },
    ): Promise<void> => login(this, auth.userId ?? this.userId, auth.password ?? this.password);

    /**
     * Log out and clear fields `userId` and `password` of this `InfoHelper` instance
     */
    public logout = async (): Promise<void> => logout(this);

    /**
     * THIS METHOD IS INTENDED FOR APP USE ONLY.
     */
    public forgetDevice = async (): Promise<void> => forgetDevice(this);

    /**
     * THIS METHOD IS INTENDED FOR APP USE ONLY.
     *
     * ANY BREAKING CHANGES SHALL NOT BE DOCUMENTED.
     */
    public appStartUp = async (platform: "ios" | "android", uuid: string) => {
        if (this.userId === "") {
            return {
                bookingRecords: [],
                sportsReservationRecords: [],
                crTimetable: [],
                balance: 0,
                latestAnnounces: [],
                latestVersion: MOCK_LATEST_VERSION,
            };
        }
        const latestAnnounces = await getLatestAnnounces(this);
        const latestVersion = await getLatestVersion(this, platform);
        let bookingRecords: LibBookRecord[] = [];
        const sportsReservationRecords: SportsReservationRecord[] = [];
        let balance: number = 0;
        let crTimetable: CrTimetable[] = [];
        try {
            bookingRecords = await getBookingRecords(this);
            balance = (await cardGetInfo(this)).balance;
            crTimetable = await getCrTimetable(this);
        } catch {
            // no-op
        }
        appStartupStat(this, uuid).catch(() => {
        });
        return {bookingRecords, sportsReservationRecords, crTimetable, balance, latestAnnounces, latestVersion};
    };

    public appUsageStat = async (usage: number, uuid: string) => {
        await appUsageStat(this, usage, uuid);
    };

    public getLatestAnnounces = async () => getLatestAnnounces(this);

    public getLatestVersion = async (platform: "ios" | "android") => getLatestVersion(this, platform);

    public submitFeedback = async (
        content: string,
        appversion: string,
        os: string,
        nickname: string,
        contact: string,
        phonemodel: string,
    ) => submitFeedback(this, content, appversion, os, nickname, contact, phonemodel);

    public getFeedbackReplies = async () => getFeedbackReplies(this);

    public getWeChatGroupQRCodeContent = async () => getWeChatGroupQRCodeContent(this);

    public getPrivacyUrl = () => getPrivacyUrl(this);

    /**
     * Switch the language.
     *
     * This will affect the language of data returned from some APIs.
     *
     * @param lang  either "zh" or "en"
     */
    public switchLang = async (lang: "zh" | "en"): Promise<void> => switchLang(this, lang);

    /**
     * Get the user's full name and email name (i.e. username for email
     * account)
     */
    public getUserInfo = async () => getUserInfo(this);

    /**
     * A naive API that sends an email from the user's Tsinghua mail.
     * @param subject    Subject of email
     * @param content    Content of email
     * @param recipient  Recipient of email. Sending an email to multiple
     *                   recipients is not supported yet.
     */
    public naiveSendMail = async (subject: string, content: string, recipient: string) => naiveSendMail(this, subject, content, recipient);

    /**
     * Get the school report of the user.
     *
     * @param bx      a boolean indicating whether to contain only required and
     *                restricted courses (and omit elective courses)
     * @param newGPA  a boolean indicating whether to adopt the new GPA policy
     * @param flag    switch between first degree (1), second degree (2) and
     *                minor courses (3), defaults to 1
     *
     * Note that `bx` takes effect only if `flag` equals to `1`
     */
    public getReport = (
        bx: boolean,
        newGPA: boolean,
        flag = 1,
    ): Promise<Course[]> => getReport(this, bx, newGPA, flag);

    /**
     * Get the assessment list of teaching evaluation.
     *
     * @return  An array of courses. Each course is represented with a
     *          three-element tuple, referring to name of course, whether
     *          the course has been evaluated and the url of its evaluation
     *          form (which can then be passed into `getAssessmentForm`.
     */
    public getAssessmentList = (): Promise<[string, boolean, string][]> =>
        getAssessmentList(this);

    /**
     * Get the evaluation form of a course from its url.
     * @param url  the corresponding form url to the course to evaluate
     */
    public getAssessmentForm = (url: string): Promise<Form> =>
        getAssessmentForm(this, url);

    /**
     * Submit the evaluation form.
     */
    public postAssessmentForm = (form: Form): Promise<void> =>
        postAssessmentForm(this, form);

    /**
     * Get the physical exam score of the user.
     *
     * @return Returns a [string, string][], where the first string refers to
     *         the exam item, and the second refers to the exam score.
     */
    public getPhysicalExamResult = (): Promise<[string, string][]> =>
        getPhysicalExamResult(this);

    /**
     * Get all classroom buildings available for querying for classroom status.
     *
     * Note that you should use `searchName` from the returned struct for
     * future querying.
     */
    public getClassroomList = (): Promise<Classroom[]> => getClassroomList(this);

    /**
     * Get the classroom state of specific classroom building and week number.
     * @param building  a string representing the queried building
     * @param week      a number representing the queried week number
     */
    public getClassroomState = (
        building: string,
        week: number,
    ): Promise<ClassroomStateResult> => getClassroomState(this, building, week);

    /**
     * Get the list of invoices.
     *
     * This API is paginated.
     *
     * @param page  page number, starting from 1
     */
    public getInvoiceList = async (page: number): Promise<{
        data: Invoice[];
        count: number
    }> => getInvoiceList(this, page);

    /**
     * Get the invoice PDF in base64 format.
     */
    public getInvoicePDF = async (uuid: string): Promise<string> => getInvoicePDF(this, uuid);

    /**
     * Get the bank payment records of the user.
     * @param foundation  whether to get bank payment result by 基金会 or not
     * @param loadPartial whether to load only the recent three months
     */
    public getBankPayment = async (foundation = false, loadPartial = false): Promise<BankPaymentByMonth[]> => getBankPaymentParellize(this, foundation, loadPartial);

    /**
     * Get the graduate income records of the user according to the date range
     * @param begin  YYYYMMDD
     * @param end    YYYYMMDD
     */
    public getGraduateIncome = async (
        begin: string,  // YYYYMMDD
        end: string,    // YYYYMMDD
    ): Promise<GraduateIncome[]> => getGraduateIncome(this, begin, end);

    /**
     * Get the school calendar data.
     */
    public getCalendar = async (): Promise<CalendarData> => getCalendar(this);

    /**
     * Get the latest school calendar year (from THUInfo backend).
     * `2024` means that 2024-2025 school year is available.
     */
    public getCalendarYear = async (): Promise<number> => getSchoolCalendarYear();

    /**
     * Get the school calendar image url
     */
    public getCalendarImageUrl = async (year: number, semester: "spring" | "autumn", lang: "zh" | "en") =>
        getCalendarImageUrl(this, year, semester, lang);

    /**
     * Get the current countdown notifications from INFO.
     */
    public getCountdown = async (): Promise<string[]> => countdown(this);

    public getMadModelToken = async (): Promise<string> =>
        getMadModelToken(this);

    /**
     * Get the dorm score image, in base64 format.
     */
    public getDormScore = async (): Promise<string> => getDormScore(this);

    /**
     * Make an electricity recharge payment order, and get the pay-code of the
     * order.
     *
     * If you want to use the pay-code on mobile devices, the url link to the
     * Alipay payment page will be
     * `"alipayqr://platformapi/startapp?saId=10000007&qrcode=https%3A%2F%2Fqr.alipay.com%2F" + payCode`
     *
     * You can also call `genAlipayUrl(payCode)` in `dist/utils/alipay` to get
     * the Alipay url.
     *
     * @param money  a number representing the amount of money to be paid
     *               <b>(in yuan, must be integer)</b>
     */
    public getEleRechargePayCode = async (money: number): Promise<string> => {
        if (!await canRechargeCampusCard(this)) {
            throw new Error("暂不支持宿舍电费充值，请升级应用程序。");
        }
        return getEleRechargePayCode(this, money);
    };

    /**
     * Get the recent ele-recharge records.
     *
     * @return Returns `[string, string, string, string, string, string][]`,
     *         where the six strings represent name, id, time, channel, value
     *         and status respectively.
     */
    public getElePayRecord = async (): Promise<[string, string, string, string, string, string][]> => getElePayRecord(this);

    /**
     * Get the current remainder of electricity.
     *
     * @return Returns a number. The return value can be NaN when the remainder
     *         info cannot be parsed.
     */
    public getEleRemainder = async (): Promise<{ remainder: number; updateTime: string }> => getEleRemainder(this);

    /**
     * Reset dorm password.
     *
     * This method works on the basis that myhome.tsinghua.edu.cn can be logged
     * in with INFO account, and the dorm password can therefore be reset,
     * without the need of a original password.
     *
     * @param newPassword  The new dorm password
     */
    public resetDormPassword = async (newPassword: string): Promise<void> => resetDormPassword(this, newPassword);

    public getLibraryList = async (): Promise<Library[]> => getLibraryList(this);

    public getLibrarySectionList = async (
        libraryFloor: LibraryFloor,
        dateChoice: 0 | 1,  // 0 for today and 1 for tomorrow
    ): Promise<LibrarySection[]> =>
        getLibrarySectionList(this, libraryFloor, dateChoice);

    public getLibraryFloorList = async (
        library: Library,
        dateChoice: 0 | 1,  // 0 for today and 1 for tomorrow
    ): Promise<LibraryFloor[]> => getLibraryFloorList(this, library, dateChoice);

    public getLibrarySeatList = async (
        librarySection: LibrarySection,
        dateChoice: 0 | 1,  // 0 for today and 1 for tomorrow
    ): Promise<LibrarySeat[]> => getLibrarySeatList(this, librarySection, dateChoice);

    public toggleSocketState = async (
        seatId: number,
        target: SocketStatus,
    ): Promise<void> => toggleSocketState(this, seatId, target);

    /**
     * Use this API to book library seats.
     */
    public bookLibrarySeat = async (
        librarySeat: LibrarySeat,
        section: LibrarySection,
        dateChoice: 0 | 1,  // 0 for today and 1 for tomorrow
    ): Promise<{ status: number; msg: string }> =>
        bookLibrarySeat(this, librarySeat, section, dateChoice);

    /**
     * Use this API to get booking records.
     */
    public getBookingRecords = async (): Promise<LibBookRecord[]> =>
        getBookingRecords(this);

    /**
     * Use this API to cancel booking.
     * @param id  the `id` from `LibBookRecord`
     */
    public cancelBooking = async (id: string): Promise<void> =>
        cancelBooking(this, id);

    /**
     * DEPRECATED.
     */
    public getLibraryRoomBookingCaptchaUrl = () => Promise.resolve("");

    /**
     * Use this API to get the account number of current user.
     *
     * The account number is used to book rooms.
     */
    public getLibraryRoomAccNo = () => getAccNo();

    /**
     * Login cab.hs.lib.tsinghua.edu.cn
     */
    public loginLibraryRoomBooking = async () => cabLogin(this);

    /**
     * Gets all available room information
     */
    public getLibraryRoomBookingInfoList = async () => getLibraryRoomBookingInfoList(this);

    /**
     * Gets all available room resources
     * @param date  yyyyMMdd
     * @param kindId
     * @return  Returns a list of all available room resources of a specific
     *          date, along with when and for whom each room is reserved.
     */
    public getLibraryRoomBookingResourceList = async (
        date: string, // yyyyMMdd
        kindId: number,
    ): Promise<LibRoomRes[]> => getLibraryRoomBookingResourceList(this, date, kindId);

    /**
     * Passes a student's name as keyword and returns the student's ID.
     *
     * FUZZY SEARCH IS NO LONGER SUPPORTED. Method name remains unchanged only
     * for compatability reasons.
     *
     * @param keyword  a string that serves as the search keyword
     */
    public fuzzySearchLibraryId = async (
        keyword: string
    ): Promise<LibFuzzySearchResult[]> => fuzzySearchLibraryId(this, keyword);

    /**
     * Performs a booking request of a library room.
     *
     * @param roomRes     a `LibRoomRes` object referring to the room that is requested for booking
     * @param start       the beginning time of booking, <b>in format `yyyy-MM-dd HH:mm:SS` where `mm` should be a multiple of 5 and `SS` should be `00`</b>
     * @param end         the ending time of booking, <b>in format `yyyy-MM-dd HH:mm:SS` where `mm` should be a multiple of 5 and `SS` should be `00`</b>
     * @param memberList  a list of strings
     */
    public bookLibraryRoom = async (
        roomRes: LibRoomRes,
        start: string,  // yyyy-MM-dd HH:mm
        end: string,  // yyyy-MM-dd HH:mm
        memberList: number[],  // student id's, empty for single user
    ) => bookLibraryRoom(this, roomRes, start, end, memberList);

    /**
     * Returns all active booking records.
     */
    public getLibraryRoomBookingRecord = async (): Promise<LibRoomBookRecord[]> => getLibraryRoomBookingRecord(this);

    /**
     * Cancels a specific library booking record.
     * @param uuid  `uuid` of `LibRoomBookRecord`
     */
    public cancelLibraryRoomBooking = async (uuid: string) => cancelLibraryRoomBooking(this, uuid);

    /**
     * Updates email for library room booking system.
     * @param email  email
     */
    public updateLibraryRoomEmail = async (email: string) => updateLibraryRoomEmail(this, email);

    /**
     * Get the news list of all channels or a specific channel.
     *
     * This API is paginated.
     */
    public getNewsList = async (
        page: number,
        length: number,
        channel?: ChannelTag
    ): Promise<NewsSlice[]> => getNewsList(this, page, length, channel);

    /**
     * Search the news list with a keyword.
     *
     * This API is paginated.
     */
    public searchNewsList = async (
        page: number,
        key: string,
        channel?: ChannelTag
    ): Promise<NewsSlice[]> => searchNewsList(this, page, key, channel, true);

    /**
     * Get all news subscription items.
     */
    public getNewsSubscriptionList = async (): Promise<NewsSubscription[]> => getNewsSubscriptionList(this);

    /**
     * Get all available news sources for subscription.
     */
    public getNewsSourceList = async (): Promise<{ sourceId: string, sourceName: string }[]> => getNewsSourceList(this);

    /**
     * Get all available news channels for subscription.
     * @param needEnglish
     */
    public getNewsChannelList = async (needEnglish: boolean): Promise<{
        id: ChannelTag,
        title: string
    }[]> => getNewsChannelList(this, needEnglish);

    /**
     * if channelId and sourceId is null or undefined at the same time, this function will terminate and return false.
     * @param channelId channel id
     * @param sourceId source id
     * @param keyword news keyword
     * @returns
     */
    public addNewsSubscription = async (channelId?: ChannelTag, sourceId?: string, keyword?: string): Promise<boolean> =>
        addNewsSubscription(this, channelId, sourceId, keyword);

    /**
     * Remove a news subscription.
     * @param subscriptionId
     */
    public removeNewsSubscription = async (subscriptionId: string): Promise<boolean> => removeNewsSubscription(this, subscriptionId);

    /**
     * Gets the news list by a specific subscription.
     *
     * This API is paginated.
     */
    public getNewsListBySubscription = async (page = 1, subscriptionId?: string) => getNewsListBySubscription(this, page, subscriptionId ?? "");

    /**
     * Get the detailed news with the url provided.
     * @param url  the url of the queried news
     * @return  Returns `[string, string, string][]`, where the three `string`s
     *          represent title, content and abstract respectively.
     */
    public getNewsDetail = async (
        url: string,
    ): Promise<[string, string, string]> => getNewsDetail(this, url);

    /**
     * Adds a specific piece of news to fav list.
     * @param news
     */
    public addNewsToFavor = async (news: NewsSlice): Promise<boolean> => addNewsToFavor(this, news);

    /**
     * Remove a specific piece of news from fav list.
     * @param news
     */
    public removeNewsFromFavor = async (news: NewsSlice): Promise<boolean> => removeNewsFromFavor(this, news);

    /**
     * if the page is out of range, the NewsSlice will be a 0 length array.
     * @param page page of favor list
     * @returns [array of NewsSlice,total pages]
     */
    public getFavorNewsList = async (page: number): Promise<[NewsSlice[], number]> => getFavorNewsList(this, page);

    /**
     * Get the schedules of the user.
     * @param nextSemesterIndex if provided, specifies a semester from the `nextSemesterList`
     * @return  Returns `Schedule[]`, containing all the schedules(including
     *          exams) of the user.
     */
    public getSchedule = async (nextSemesterIndex?: number) => getSchedule(this, nextSemesterIndex);

    /**
     * Gets the timetable for course registration.
     */
    public getCrTimetable = async () => getCrTimetable(this);

    /**
     * Gets the login captcha url for the course registration system.
     */
    public getCrCaptchaUrl = async () => getCrCaptchaUrl(this);

    /**
     * Log in to the course registration system with the captcha.
     */
    public loginCr = async () => loginCr(this);

    /**
     * Get all semesters available for course registration.
     */
    public getCrAvailableSemesters = async () => getCrAvailableSemesters(this);

    /**
     * Get the course plan of a given semester.
     * @param semester
     */
    public getCrCoursePlan = async (semester: string) => getCoursePlan(this, semester);

    /**
     * Search courses for registration remaining data
     * @param params
     */
    public searchCrRemaining = async (params: SearchParams) => searchCrRemaining(this, params);

    /**
     * Search primary courses
     * @param params
     */
    public searchCrPrimaryOpen = async (params: SearchParams) => searchCrPrimaryOpen(this, params);

    /**
     * Search courses for registration
     * @param params
     */
    public searchCrCourses = async (params: SearchParams) => searchCrCourses(this, params);

    /**
     * Select a course.
     * @param semesterId  semester id
     * @param priority    "bx" | "xx" | "rx" | "ty" | "cx"
     * @param courseId    course id
     * @param courseSeq   course seq number
     * @param will        1 | 2 | 3
     */
    public selectCourse = async (
        semesterId: string,
        priority: Priority,
        courseId: string,
        courseSeq: string,
        will: 1 | 2 | 3,
    ) => selectCourse(this, semesterId, priority, courseId, courseSeq, will);

    /**
     * Delete a course
     * @param semesterId
     * @param courseId
     * @param courseSeq
     */
    public deleteCourse = async (
        semesterId: string,
        courseId: string,
        courseSeq: string,
    ) => deleteCourse(this, semesterId, courseId, courseSeq);

    /**
     * Get all selected courses
     * @param semesterId
     */
    public getSelectedCourses = async (semesterId: string) => getSelectedCourses(this, semesterId);

    /**
     * Change a will of a course
     * @param semesterId
     * @param courseId
     * @param courseSeq
     * @param will
     */
    public changeCourseWill = async (
        semesterId: string,
        courseId: string,
        courseSeq: string,
        will: 1 | 2 | 3,
    ) => changeCourseWill(this, semesterId, courseId, courseSeq, will);

    /**
     * Get current course registration stage
     * @param semesterId
     */
    public getCrCurrentStage = async (semesterId: string) => getCrCurrentStage(this, semesterId);

    /**
     * Gets when is the latest course registration queue info released, and
     * when is the next time for release.
     * @param semesterId
     */
    public searchCoursePriorityMeta = async (semesterId: string) => searchCoursePriorityMeta(this, semesterId);

    /**
     * Gets the course registration data for remaining position
     * @param semesterId
     * @param query
     */
    public searchCoursePriorityInformation = async (
        semesterId: string,
        query: SearchCoursePriorityQuery,
    ) => searchCoursePriorityInformation(this, semesterId, query);

    /**
     * Gets course registration queue info
     * @param semesterId
     */
    public getQueueInfo = async (semesterId: string) => getQueueInfo(this, semesterId);

    /**
     * Cancel PF registration for a course
     * @param semesterId
     * @param courseId
     */
    public cancelCoursePF = async (semesterId: string, courseId: string) => cancelCoursePF(this, semesterId, courseId);

    /**
     * Set PF mark for a course
     * @param semesterId
     * @param courseId
     */
    public setCoursePF = async (semesterId: string, courseId: string) => setCoursePF(this, semesterId, courseId);

    /**
     * Gets all available sports resources.
     *
     * `gymId` and `itemId` can be found in `sportsIdInfoList` from `dist/lib/sports`.
     *
     * @param gymId
     * @param itemId
     * @param date    yyyy-MM-dd
     */
    public getSportsResources = async (
        gymId: string,
        itemId: string,
        date: string, // yyyy-MM-dd
    ) => getSportsResources(this, gymId, itemId, date);

    /**
     * Saves the phone number in the sports reservation system
     * @param phone
     */
    public updateSportsPhoneNumber = async (phone: string) => updateSportsPhoneNumber(this, phone);

    /**
     * Gets the url to the captcha for sports reservation
     */
    public getSportsCaptchaUrl = () => getSportsCaptchaUrlMethod();

    /**
     * Makes a sports reservation and gets the alipay pay-code if payment is
     * required.
     *
     * If you want to use the pay-code on mobile devices, the url link to the
     * Alipay payment page will be
     * `"alipayqr://platformapi/startapp?saId=10000007&qrcode=https%3A%2F%2Fqr.alipay.com%2F" + payCode`
     *
     * You can also call `genAlipayUrl(payCode)` in `dist/utils/alipay` to get
     * the Alipay url.
     *
     * @param totalCost     a number indicating the total cost of the reservation
     * @param phone         a string representing the user's phone number
     * @param receiptTitle  a string representing the title of the receipt, or `undefined` if a receipt is not needed
     * @param gymId         a string representing the ID of the gym
     * @param itemId        a string representing the ID of the item
     * @param date          a string in the format of `yyyy-MM-dd`
     * @param captcha       a string representing the captcha
     * @param resHashId     a string representing the hash of the resource
     * @param skipPayment   whether to skip payment (and pay later)
     * @return  Returns a string representing the alipay payment code if payment is required, or `undefined` if no payment is needed.
     */
    public makeSportsReservation = async (
        totalCost: number,
        phone: string,
        receiptTitle: ValidReceiptTypes | undefined,
        gymId: string,
        itemId: string,
        date: string,  // yyyy-MM-dd
        captcha: string,
        resHashId: string,
        skipPayment = false,
    ) => makeSportsReservation(this, totalCost, phone, receiptTitle, gymId, itemId, date, captcha, resHashId, skipPayment);

    /**
     * Gets all active sports reservation records.
     */
    public getSportsReservationRecords = async () => getSportsReservationRecords(this);

    /**
     * Make sports reservation payment with a payId.
     */
    public paySportsReservation = async (
        payId: string,
        receiptTitle: ValidReceiptTypes | undefined,
    ): Promise<string> => paySportsReservation(this, payId, receiptTitle);

    /**
     * Cancel a sports reservation <b>if payment has not been made</b>
     * @param bookId  a string representing the ID of the reservation
     */
    public unsubscribeSportsReservation = async (bookId: string) => unsubscribeSportsReservation(this, bookId);

    public getGitNamespaces = async (page: number) => getNamespaces(this, page);

    public getGitRecentProjects = async (page: number) => getRecentProjects(this, page);

    public getGitOwnedProjects = async (name: string, page: number) => getPersonalProjects(this, name, page);

    public searchGitProjects = async (search: string, page: number) => searchProjects(this, search, page);

    public getGitStarredProjects = async (page: number) => getStarredProjects(this, page);

    public getGitProjectDetail = async (id: number) => getProjectDetail(this, id);

    public getGitProjectTree = async (
        id: number,
        path: string,
        ref: string,
        page: number,
    ) => getProjectTree(this, id, path, ref, page);

    public getGitProjectBranches = async (id: number) => getProjectBranches(this, id);

    public getGitProjectFileBlob = async (id: number, sha: string) => getProjectFileBlob(this, id, sha);

    public renderGitMarkdown = async (text: string) => renderMarkdown(this, text);

    public searchReservesLib = async (bookName: string, page?: number) => searchReservesLib(this, bookName, page);

    public getReservesLibBookDetail = async (bookId: string) => bookDetail(this, bookId);

    public reservesLibDownloadChapters = async (chapters: BookChapter[], setCompletion?: (total: number, complete: number) => void) => downloadChapters(chapters, setCompletion);

    public getDegreeProgramCompletion = async () => getDegreeProgramCompletion(this);

    public getFullDegreeProgram = async (degreeId?: number, skippedSet?: string[]) => getFullDegreeProgram(this, degreeId, skippedSet);

    public getNetworkVerificationImageUrl = async () => getNetworkVerificationImageUrl(this);

    public loginUsereg = async (code: string) => loginUsereg(this, code);

    public getOnlineDevices = async () => getOnlineDevices(this);

    public getNetworkBalance = async () => getNetworkBalance(this);

    public getNetworkAccountInfo = async () => getNetworkAccountInfo(this);

    public logoutNetworkDevice = async (device: Device) => logoutNetwork(device);

    public loginNetworkDevice = async (ip: string, internet: boolean) => loginNetwork(this, ip, internet);

    public getScoreByCourseId = async (courseId: string) => getScoreByCourseId(this, courseId);

    public loginCampusCard = async () => cardLogin(this);

    public getCampusCardInfo = async () => cardGetInfo(this);

    public getCampusCardPhotoUrl = async () => cardGetPhotoUrl();

    /**
     * Get the campus card transactions.
     * @param start YYYY-MM-DD
     * @param end YYYY-MM-DD
     * @param type -1 for all (1-3), 1 for consumption, 2 for recharge, 3 for subsidy, 0 for ALL (?)
     */
    public getCampusCardTransactions = async (start: string, end: string, type: CardTransactionType) =>
        cardGetTransactions(this, start, end, type);

    public changeCampusCardPassword = async (oldPassword: string, newPassword: string) => cardChangeTransactionPassword(this, oldPassword, newPassword);

    public modifyCampusCardMaxTransactionAmount = async (transactionPassword: string, maxDailyAmount: number, maxOneTimeAmount: number) =>
        cardModifyMaxTransactionAmount(this, transactionPassword, maxDailyAmount, maxOneTimeAmount);

    public reportCampusCardLoss = async (transactionPassword: string) => cardReportLoss(this, transactionPassword);

    public cancelCampusCardLoss = async (transactionPassword: string) => cardCancelLoss(this, transactionPassword);

    /**
     * Recharge the campus card.
     * @param amount in yuan
     * @param transactionPassword
     * @param type 0 for Bank Card, 1 for Alipay, 2 for Wechat Pay
     * @return Uri to request to complete the payment process, undefined for Bank
     */
    public rechargeCampusCard = async (amount: number, transactionPassword: string, type: CardRechargeType) => {
        if (!await canRechargeCampusCard(this)) {
            throw new Error("暂不支持校园卡充值，请升级应用程序。");
        }
        if (type === CardRechargeType.Bank) {
            return cardRechargeFromBank(this, transactionPassword, amount);
        }

        return cardRechargeFromWechatAlipay(this, amount, type === CardRechargeType.Alipay);
    };
}
