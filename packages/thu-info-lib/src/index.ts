import {
    countdown,
    getAssessmentForm,
    getAssessmentList,
    getClassroomState,
    getUserInfo,
    getExpenditures,
    getPhysicalExamResult,
    getReport,
    loseCard,
    postAssessmentForm,
    getBankPayment,
    getCalendar,
} from "./lib/basics";
import {login, logout} from "./lib/core";
import {getElePayRecord, getEleRechargePayCode, getEleRemainder} from "./lib/dorm";
import {getUserInformation, getUserInformationAndStore, postWaterSubmission} from "./lib/water";
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
    getLibraryRoomBookingRecord,
    getLibraryRoomBookingResourceList,
    getLibrarySeatList,
    getLibrarySectionList,
} from "./lib/library";
import {getNewsDetail, getNewsList} from "./lib/news";
import {getSchedule} from "./lib/schedule";
import {Course} from "./models/home/report";
import {Form} from "./models/home/assessment";
import {Record} from "./models/home/expenditure";
import {NewsSlice, SourceTag} from "./models/news/news";
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
    getCrCaptchaUrlMethod,
    getCoursePlan,
    loginCr,
    searchCrRemaining,
    searchCrPrimaryOpen,
    searchCrCourses, getCrAvailableSemestersMethod,
} from "./lib/cr";
import {SearchParams} from "./models/cr/cr";
import {BankPaymentByMonth} from "./models/home/bank";
import {
    getNamespaces,
    getPersonalProjects,
    getProjectDetail,
    getProjectFileBlob,
    getProjectTree,
    getRecentProjects,
    renderMarkdown,
    searchProjects,
} from "./lib/gitlab";
import {CalendarData} from "./models/schedule/calendar";

export class InfoHelper {
    public userId = "";
    public password = "";
    public dormPassword = "";

    public MOCK = "8888";

    public mocked = () => this.userId === this.MOCK && this.password === this.MOCK;

    public graduate = () => this.userId.length > 4 ? (this.userId[4] === "2" || this.userId[4] === "3") : false;

    public clearCookieHandler = async () => {
    };

    public login = async (
        auth: {
            userId?: string;
            password?: string;
            dormPassword?: string;
        },
    ): Promise<void> => login(this, auth.userId ?? this.userId, auth.password ?? this.password, auth.dormPassword ?? this.dormPassword);

    public logout = async (): Promise<void> => logout(this);

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

    public getExpenditures = (
        beg: Date,
        end: Date,
    ): Promise<[Record[], number, number, number]> =>
        getExpenditures(this, beg, end);

    public getClassroomState = (
        name: string,
        week: number,
    ): Promise<[string, number[]][]> => getClassroomState(this, name, week);

    public loseCard = async (): Promise<number> => loseCard(this);

    public getBankPayment = async (): Promise<BankPaymentByMonth[]> => getBankPayment(this);

    public getCalendar = async (): Promise<CalendarData> => getCalendar(this);

    public getCountdown = async (): Promise<string[]> => countdown();

    public getEleRechargePayCode = async (money: number): Promise<string> =>
        getEleRechargePayCode(this, money);

    public getElePayRecord = async (): Promise<[string, string, string, string, string, string][]> => getElePayRecord(this);

    public getEleRemainder = async (): Promise<number> => getEleRemainder(this);

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
    ): Promise<{status: number; msg: string}> =>
        bookLibrarySeat(this, librarySeat, section, dateChoice);

    public getBookingRecords = async (): Promise<LibBookRecord[]> =>
        getBookingRecords(this);

    public cancelBooking = async (id: string): Promise<void> =>
        cancelBooking(this, id);

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
    ): Promise<{success: boolean, msg: string}> => bookLibraryRoom(this, roomRes, start, end, memberList);

    public getLibraryRoomBookingRecord = async (): Promise<LibRoomBookRecord[]> => getLibraryRoomBookingRecord(this);

    public cancelLibraryRoomBooking = async (id: string): Promise<{success: boolean, msg: string}> => cancelLibraryRoomBooking(this, id);

    public getNewsList = async (
        channel: SourceTag,
        page: number,
    ): Promise<NewsSlice[]> => getNewsList(this, channel, page);

    public getNewsDetail = async (
        url: string,
    ): Promise<[string, string, string]> => getNewsDetail(this, url);

    public getSchedule = async () => getSchedule(this);

    public getCrCaptchaUrl = async () => getCrCaptchaUrlMethod();

    public loginCr = async (captcha: string) => loginCr(this, captcha);

    public getCrAvailableSemesters = async () => getCrAvailableSemestersMethod();

    public getCrCoursePlan = async (semester: string) => getCoursePlan(this, semester);

    public searchCrRemaining = async (params: SearchParams) => searchCrRemaining(this, params);

    public searchCrPrimaryOpen = async (params: SearchParams) => searchCrPrimaryOpen(this, params);

    public searchCrCourses = async (params: SearchParams) => searchCrCourses(this, params);

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

    public searchGitProjects = async (search: string) => searchProjects(this, search);

    public getGitProjectDetail = async (id: number) => getProjectDetail(this, id);

    public getGitProjectTree = async (
        id: number,
        path: string,
        ref: string,
        page: number,
    ) => getProjectTree(this, id, path, ref, page);

    public getGitProjectFileBlob = async (id: number, sha: string) => getProjectFileBlob(this, id, sha);

    public renderGitMarkdown = async (text: string) => renderMarkdown(this, text);
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
