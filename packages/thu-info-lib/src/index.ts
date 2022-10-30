import {
    countdown,
    getAssessmentForm,
    getAssessmentList,
    getClassroomList,
    getClassroomState,
    getUserInfo,
    getExpenditures,
    getPhysicalExamResult,
    getReport,
    loseCard,
    postAssessmentForm,
    getBankPayment,
    getCalendar,
    getInvoiceList,
    getInvoicePDF,
    switchLang,
    naiveSendMail,
} from "./lib/basics";
import { login, logout } from "./lib/core";
import {getDormScore, getElePayRecord, getEleRechargePayCode, getEleRemainder, resetDormPassword} from "./lib/dorm";
import { getUserInformation, getUserInformationAndStore, postWaterSubmission } from "./lib/water";
import {
    LibBookRecord,
    LibFuzzySearchResult,
    Library,
    LibraryFloor,
    LibrarySeat,
    LibrarySection,
    LibRoomBookRecord,
    LibRoomRes,
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
    getLibraryRoomBookingCaptchaUrl,
    getLibraryRoomBookingRecord,
    getLibraryRoomBookingResourceList,
    getLibrarySeatList,
    getLibrarySectionList,
    loginLibraryRoomBooking,
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
import { getSchedule } from "./lib/schedule";
import { Course } from "./models/home/report";
import { Form } from "./models/home/assessment";
import { Record } from "./models/home/expenditure";
import {NewsSlice, NewsSubscription, ChannelTag} from "./models/news/news";
import {
    getSportsCaptchaUrlMethod,
    getSportsReservationRecords,
    getSportsResources,
    makeSportsReservation,
    unsubscribeSportsReservation,
    updateSportsPhoneNumber,
    ValidReceiptTypes,
} from "./lib/sports";
import {
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
import { SearchCoursePriorityQuery, SearchParams } from "./models/cr/cr";
import { BankPaymentByMonth } from "./models/home/bank";
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
import { CalendarData } from "./models/schedule/calendar";
import {bookDetail, downloadChapters, searchReservesLib} from "./lib/reserves-lib";
import {BookChapter} from "./models/home/reserves-lib";
import {Invoice} from "./models/home/invoice";
import {LoginError} from "./utils/error";
import { getDegreeProgramCompletion, getFullDegreeProgram } from "./lib/program";
import {Classroom} from "./models/home/classroom";

export class InfoHelper {
    public userId = "";
    public password = "";

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
     *
     * ANY BREAKING CHANGES SHALL NOT BE DOCUMENTED.
     */
    public appStartUp = async () => {
        if (this.userId === "") {
            return {
                bookingRecords: [],
                sportsReservationRecords: [],
            };
        }
        const bookingRecords = await getBookingRecords(this);
        const sportsReservationRecords = await getSportsReservationRecords(this);
        return {bookingRecords, sportsReservationRecords};
    };

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
     * Get the expenditure records of the user.
     */
    public getExpenditures = (): Promise<Record[]> => getExpenditures(this);

    /**
     * Get all classroom buildings available for querying for classroom status.
     *
     * Note that you should use `searchName` from the returned struct for
     * future querying.
     */
    public getClassroomList = (): Promise<Classroom[]> => getClassroomList(this);

    /**
     * Get the classroom state of specific classroom building and week number.
     * @param name  a string representing the queried building
     * @param week  a number representing the queried week number
     *
     * @return  Returns `[string, number[]][]`, where the string represents the
     *          classroom name and the number[] is an array of 42(=7*6) numbers
     *          representing the classroom status of the queried week (starting
     *          from Monday).
     *
     *          The status number ranges from 0 to 5:
     *
     *          0 for Teaching
     *
     *          1 for Exam
     *
     *          2 for Borrowed
     *
     *          3 for Disabled
     *
     *          4 for Unknown (Usually indicates an error in this lib)
     *
     *          5 for Available
     */
    public getClassroomState = (
        name: string,
        week: number,
    ): Promise<[string, number[]][]> => getClassroomState(this, name, week);

    /**
     * Get the list of invoices.
     *
     * This API is paginated.
     *
     * @param page  page number, starting from 1
     */
    public getInvoiceList = async (page: number): Promise<{data: Invoice[]; count: number}> => getInvoiceList(this, page);

    /**
     * Get the invoice PDF in base64 format.
     */
    public getInvoicePDF = async (busNumber: string): Promise<string> => getInvoicePDF(this, busNumber);

    /**
     * Report to the school that the user's card is lost.
     *
     * @return  Returns a status code:
     *
     *          2 - Successful.
     *
     *          4 - Already reported, do not request again.
     *
     *          5 - Invalid card.
     *
     *          -1 - No card information.
     *
     *          -2 - Card expired.
     *
     *          -100 - School database error.
     *
     *          7 - School server error.
     */
    public loseCard = async (): Promise<number> => loseCard(this);

    /**
     * Get the bank payment records of the user.
     * @param foundation  whether to get bank payment result by 基金会 or not
     */
    public getBankPayment = async (foundation = false): Promise<BankPaymentByMonth[]> => getBankPayment(this, foundation);

    /**
     * Get the school calendar data.
     */
    public getCalendar = async (): Promise<CalendarData> => getCalendar(this);

    /**
     * Get the current countdown notifications from INFO.
     */
    public getCountdown = async (): Promise<string[]> => countdown(this);

    /**
     * Get the dorm score image, in base64 format.
     * @param dormPassword  password for myhome.tsinghua.edu.cn
     */
    public getDormScore = async (dormPassword: string): Promise<string> => getDormScore(this, dormPassword);

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
    public getEleRechargePayCode = async (money: number): Promise<string> =>
        getEleRechargePayCode(this, money);

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
    public getEleRemainder = async (): Promise<{remainder: number; updateTime: string}> => getEleRemainder(this);

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
     * Captcha verification is required for lib-room reservation now.
     *
     * Use this API to get the url of the captcha.
     */
    public getLibraryRoomBookingCaptchaUrl = () => getLibraryRoomBookingCaptchaUrl(this);

    /**
     * Captcha verification is required for lib-room reservation now.
     *
     * Use this API to log in with the captcha.
     */
    public loginLibraryRoomBooking = async (captcha: string) => loginLibraryRoomBooking(this, captcha);

    /**
     * Gets all available room resources
     * @param date  yyyyMMdd
     * @return  Returns a list of all available room resources of a specific
     *          date, along with when and for whom each room is reserved.
     */
    public getLibraryRoomBookingResourceList = async (
        date: string, // yyyyMMdd
    ): Promise<LibRoomRes[]> => getLibraryRoomBookingResourceList(this, date);

    /**
     * Passes a student's name as keyword and returns the student's ID.
     *
     * Fuzzy search is supported.
     *
     * This method is supposed to be used only during group registration for
     * lib rooms.
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
     * @param start       the beginning time of booking, <b>in format `yyyy-MM-dd HH:mm` where `mm` should be a multiple of 5</b>
     * @param end         the ending time of booking, <b>in format `yyyy-MM-dd HH:mm` where `mm` should be a multiple of 5</b>
     * @param memberList  a list of strings, <b>which should be empty if the room is used by one person, and should contain the ID's of all members (including the owner's) if the room is used by more than one person</b>
     */
    public bookLibraryRoom = async (
        roomRes: LibRoomRes,
        start: string,  // yyyy-MM-dd HH:mm
        end: string,  // yyyy-MM-dd HH:mm
        memberList: string[],  // student id's, empty for single user
    ): Promise<{ success: boolean, msg: string }> => bookLibraryRoom(this, roomRes, start, end, memberList);

    /**
     * Returns all active booking records.
     */
    public getLibraryRoomBookingRecord = async (): Promise<LibRoomBookRecord[]> => getLibraryRoomBookingRecord(this);

    /**
     * Cancels a specific library booking record.
     * @param id  `rsvId` of `LibRoomBookRecord`
     */
    public cancelLibraryRoomBooking = async (id: string): Promise<{ success: boolean, msg: string }> => cancelLibraryRoomBooking(this, id);

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
    ): Promise<NewsSlice[]> => searchNewsList(this, page, key, channel);

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
    public getNewsChannelList = async (needEnglish: boolean): Promise<{ id: ChannelTag, title: string }[]> => getNewsChannelList(this, needEnglish);

    /**
     * if channelId and sourceId is null or undefined at the same time, this function will terminate and return false.
     * @param channelId channel id
     * @param sourceId source id
     * @returns
     */
    public addNewsSubscription = async (channelId?: ChannelTag, sourceId?: string): Promise<boolean> => addNewsSubscription(this, channelId, sourceId);

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
     * @return  Returns `Schedule[]`, containing all the schedules(including
     *          exams) of the user.
     */
    public getSchedule = async () => getSchedule(this);

    /**
     * Gets the login captcha url for the course registration system.
     */
    public getCrCaptchaUrl = async () => getCrCaptchaUrl(this);

    /**
     * Log in to the course registration system with the captcha.
     */
    public loginCr = async (captcha: string) => loginCr(this, captcha);

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
     * @param fieldId       a string representing the ID of the field
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
        fieldId: string,
    ) => makeSportsReservation(this, totalCost, phone, receiptTitle, gymId, itemId, date, captcha, fieldId);

    /**
     * Gets all active sports reservation records.
     */
    public getSportsReservationRecords = async () => getSportsReservationRecords(this);

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
}

export class Water {
    public id = ""; // 档案号
    public num = ""; // 订水量
    public num1 = ""; // 订水票量
    public lid = ""; // 水种类
    public address = ""; // 地址
    public phone = ""; // 电话
    /*
    "6":清紫源泉矿泉水（高端）
    "10":燕园泉矿泉水（高端）
    "12":农夫山泉桶装水（19L）
    "11":清紫源泉矿泉水
    "8":喜士天然矿泉水（大）
    "9":喜士天然矿泉水（小）
    "1":娃哈哈矿泉水
    "7":娃哈哈纯净水
    "5":清紫源泉纯净水
    */
    public getUserInformation = async (id: string) => getUserInformation(this, id);

    public getUserInformationAndStore = async (id: string) => getUserInformationAndStore(this, id);

    public postWaterSubmission = async (num: string, num1: string, lid: string) => postWaterSubmission(this, num, num1, lid);
}
