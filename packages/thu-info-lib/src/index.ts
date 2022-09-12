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
import { getDegreeProgram } from "./lib/program";

export class InfoHelper {
    public userId = "";
    public password = "";

    public MOCK = "8888";

    public mocked = () => this.userId === this.MOCK && this.password === this.MOCK;

    public graduate = () => this.userId.length > 4 ? (this.userId[4] === "2" || this.userId[4] === "3") : false;

    public clearCookieHandler = async () => {
    };

    public loginErrorHook: ((e: LoginError) => any) | undefined = undefined;

    public login = async (
        auth: {
            userId?: string;
            password?: string;
        },
    ): Promise<void> => login(this, auth.userId ?? this.userId, auth.password ?? this.password);

    public logout = async (): Promise<void> => logout(this);

    public switchLang = async (lang: "zh" | "en"): Promise<void> => switchLang(this, lang);

    public getUserInfo = async () => getUserInfo(this);

    public getReport = (
        bx: boolean,
        newGPA: boolean,
        flag = 1,
    ): Promise<Course[]> => getReport(this, bx, newGPA, flag);

    public getAssessmentList = (): Promise<[string, boolean, string][]> =>
        getAssessmentList(this);

    public getAssessmentForm = (url: string): Promise<Form> =>
        getAssessmentForm(this, url);

    public postAssessmentForm = (form: Form): Promise<void> =>
        postAssessmentForm(this, form);

    public getPhysicalExamResult = (): Promise<[string, string][]> =>
        getPhysicalExamResult(this);

    public getExpenditures = (): Promise<Record[]> => getExpenditures(this);

    public getClassroomList = (): Promise<any[]> => getClassroomList(this);

    public getClassroomState = (
        name: string,
        week: number,
    ): Promise<[string, number[]][]> => getClassroomState(this, name, week);

    public getInvoiceList = async (page: number): Promise<{data: Invoice[]; count: number}> => getInvoiceList(this, page);

    public getInvoicePDF = async (busNumber: string): Promise<string> => getInvoicePDF(this, busNumber);

    public loseCard = async (): Promise<number> => loseCard(this);

    public getBankPayment = async (): Promise<BankPaymentByMonth[]> => getBankPayment(this);

    public getCalendar = async (): Promise<CalendarData> => getCalendar(this);

    public getCountdown = async (): Promise<string[]> => countdown(this);

    public getDormScore = async (dormPassword: string): Promise<string> => getDormScore(this, dormPassword);

    public getEleRechargePayCode = async (money: number): Promise<string> =>
        getEleRechargePayCode(this, money);

    public getElePayRecord = async (): Promise<[string, string, string, string, string, string][]> => getElePayRecord(this);

    public getEleRemainder = async (): Promise<{remainder: number; updateTime: string}> => getEleRemainder(this);

    public resetDormPassword = async (newPassword: string): Promise<void> => resetDormPassword(this, newPassword);

    public getLibraryList = async (): Promise<Library[]> => getLibraryList(this);

    public getLibrarySectionList = async (
        libraryFloor: LibraryFloor,
        dateChoice: 0 | 1,
    ): Promise<LibrarySection[]> =>
        getLibrarySectionList(this, libraryFloor, dateChoice);

    public getLibraryFloorList = async (
        library: Library,
        dateChoice: 0 | 1,
    ): Promise<LibraryFloor[]> => getLibraryFloorList(this, library, dateChoice);

    public getLibrarySeatList = async (
        librarySection: LibrarySection,
        dateChoice: 0 | 1,
    ): Promise<LibrarySeat[]> => getLibrarySeatList(this, librarySection, dateChoice);

    public bookLibrarySeat = async (
        librarySeat: LibrarySeat,
        section: LibrarySection,
        dateChoice: 0 | 1,
    ): Promise<{ status: number; msg: string }> =>
        bookLibrarySeat(this, librarySeat, section, dateChoice);

    public getBookingRecords = async (): Promise<LibBookRecord[]> =>
        getBookingRecords(this);

    public cancelBooking = async (id: string): Promise<void> =>
        cancelBooking(this, id);

    public getLibraryRoomBookingCaptchaUrl = () => getLibraryRoomBookingCaptchaUrl(this);

    public loginLibraryRoomBooking = async (captcha: string) => loginLibraryRoomBooking(this, captcha);

    public getLibraryRoomBookingResourceList = async (
        date: string, // yyyyMMdd
    ): Promise<LibRoomRes[]> => getLibraryRoomBookingResourceList(this, date);

    public fuzzySearchLibraryId = async (
        keyword: string
    ): Promise<LibFuzzySearchResult[]> => fuzzySearchLibraryId(this, keyword);

    public bookLibraryRoom = async (
        roomRes: LibRoomRes,
        start: string,  // yyyy-MM-dd HH:mm
        end: string,  // yyyy-MM-dd HH:mm
        memberList: string[],  // student id's, empty for single user
    ): Promise<{ success: boolean, msg: string }> => bookLibraryRoom(this, roomRes, start, end, memberList);

    public getLibraryRoomBookingRecord = async (): Promise<LibRoomBookRecord[]> => getLibraryRoomBookingRecord(this);

    public cancelLibraryRoomBooking = async (id: string): Promise<{ success: boolean, msg: string }> => cancelLibraryRoomBooking(this, id);

    public getNewsList = async (
        page: number,
        length: number,
        channel?: ChannelTag
    ): Promise<NewsSlice[]> => getNewsList(this, page, length, channel);

    public searchNewsList = async (
        page: number,
        key: string,
        channel?: ChannelTag
    ): Promise<NewsSlice[]> => searchNewsList(this, page, key, channel);

    public getNewsSubscriptionList = async (): Promise<NewsSubscription[]> => getNewsSubscriptionList(this);

    public getNewsSourceList = async (): Promise<{ sourceId: string, sourceName: string }[]> => getNewsSourceList(this);

    public getNewsChannelList = async (needEnglish: boolean): Promise<{ id: ChannelTag, title: string }[]> => getNewsChannelList(this, needEnglish);

    /**
     * if channelId and sourceId is null or undefined at the same time, this function will terminate and return false.
     * @param channelId channel id
     * @param sourceId source id
     * @returns
     */
    public addNewsSubscription = async (channelId?: ChannelTag, sourceId?: string): Promise<boolean> => addNewsSubscription(this, channelId, sourceId);

    public removeNewsSubscription = async (subscriptionId: string): Promise<boolean> => removeNewsSubscription(this, subscriptionId);

    public getNewsListBySubscription = async (page = 1, subscriptionId?: string) => getNewsListBySubscription(this, page, subscriptionId ?? "");

    public getNewsDetail = async (
        url: string,
    ): Promise<[string, string, string]> => getNewsDetail(this, url);

    public addNewsToFavor = async (news: NewsSlice): Promise<boolean> => addNewsToFavor(this, news);

    public removeNewsFromFavor = async (news: NewsSlice): Promise<boolean> => removeNewsFromFavor(this, news);

    /**
     * if the page is out of range, the NewsSlice will be a 0 length array.
     * @param page page of favor list
     * @returns [array of NewsSlice,total pages]
     */
    public getFavorNewsList = async (page: number): Promise<[NewsSlice[], number]> => getFavorNewsList(this, page);

    public getSchedule = async () => getSchedule(this);

    public getCrCaptchaUrl = async () => getCrCaptchaUrl(this);

    public loginCr = async (captcha: string) => loginCr(this, captcha);

    public getCrAvailableSemesters = async () => getCrAvailableSemesters(this);

    public getCrCoursePlan = async (semester: string) => getCoursePlan(this, semester);

    public searchCrRemaining = async (params: SearchParams) => searchCrRemaining(this, params);

    public searchCrPrimaryOpen = async (params: SearchParams) => searchCrPrimaryOpen(this, params);

    public searchCrCourses = async (params: SearchParams) => searchCrCourses(this, params);

    public selectCourse = async (
        semesterId: string,
        priority: Priority,
        courseId: string,
        courseSeq: string,
        will: 1 | 2 | 3,
    ) => selectCourse(this, semesterId, priority, courseId, courseSeq, will);

    public deleteCourse = async (
        semesterId: string,
        courseId: string,
        courseSeq: string,
    ) => deleteCourse(this, semesterId, courseId, courseSeq);

    public getSelectedCourses = async (semesterId: string) => getSelectedCourses(this, semesterId);

    public changeCourseWill = async (
        semesterId: string,
        courseId: string,
        courseSeq: string,
        will: 1 | 2 | 3,
    ) => changeCourseWill(this, semesterId, courseId, courseSeq, will);

    public getCrCurrentStage = async (semesterId: string) => getCrCurrentStage(this, semesterId);

    public searchCoursePriorityMeta = async (semesterId: string) => searchCoursePriorityMeta(this, semesterId);

    public searchCoursePriorityInformation = async (
        semesterId: string,
        query: SearchCoursePriorityQuery,
    ) => searchCoursePriorityInformation(this, semesterId, query);

    public getQueueInfo = async (semesterId: string) => getQueueInfo(this, semesterId);

    public getSportsResources = async (
        gymId: string,
        itemId: string,
        date: string, // yyyy-MM-dd
    ) => getSportsResources(this, gymId, itemId, date);

    public updateSportsPhoneNumber = async (phone: string) => updateSportsPhoneNumber(this, phone);

    public getSportsCaptchaUrl = () => getSportsCaptchaUrlMethod();

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

    public getSportsReservationRecords = async () => getSportsReservationRecords(this);

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

    public getDegreeProgram = async () => getDegreeProgram(this);
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
