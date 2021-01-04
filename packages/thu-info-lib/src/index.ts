import {
    getAssessmentForm,
    getAssessmentList,
    getClassroomState,
    getExpenditures,
    getJoggingRecord,
    getPhysicalExamResult,
    getReport,
    loseCard,
    postAssessmentForm,
} from "./lib/basics";
import {
    getFullName,
    getTicket,
    getTickets,
    login,
    logout,
    performGetTickets,
    retryWrapper,
} from "./lib/core";
import {ValidTickets} from "./models/network";
import {getDormScore, getElePayRecord, getEleRechargePayCode} from "./lib/dorm";
import {LibBookRecord, LibrarySeat} from "./models/home/library";
import {
    bookLibrarySeat,
    cancelBooking,
    getBookingRecords,
    getLibraryFloorList,
    getLibraryList,
    getLibrarySeatList,
    getLibrarySectionList,
} from "./lib/library";
import {getNewsDetail, getNewsList} from "./lib/news";
import {getSchedule, getSecondary, getSecondaryVerbose} from "./lib/schedule";
import * as mAssessment from "./models/home/assessment";
import * as mLibrary from "./models/home/library";
import * as mReport from "./models/home/report";
import * as mJogging from "./models/home/jogging";
import * as mExpenditure from "./models/home/expenditure";
import * as mCalendar from "./models/schedule/calendar";
import * as mSchedule from "./models/schedule/schedule";
import * as mNews from "./models/news/news";

export const MOCK = "8888";

export type InputTag = mAssessment.InputTag;

export type Form = mAssessment.Form;

export type Person = mAssessment.Person;

export type Library = mLibrary.Library;

export type LibraryBase = mLibrary.LibraryBase;

export type LibraryFloor = mLibrary.LibraryFloor;

export type LibrarySection = mLibrary.LibrarySection;

export type Course = mReport.Course;

export type JoggingRecord = mJogging.JoggingRecord;

export type Record = mExpenditure.Record;

export type Calendar = mCalendar.Calendar;

export const CalendarClass = mCalendar.Calendar;

export type SemesterType = mCalendar.SemesterType;

export type Exam = mSchedule.Exam;

export type Lesson = mSchedule.Lesson;

export const LessonType = mSchedule.LessonType;

export const matchHiddenRules = mSchedule.matchHiddenRules;

export const LessonTypeEnum = mSchedule.LessonType;

export type newsSlice = mNews.newsSlice;

export type sourceTag = mNews.sourceTag;

export class InfoHelper {
    constructor(
        public userId: string,
        public password: string,
        public dormPassword: string,
    ) {}

    public setCredentials = (userId: string, password: string) => {
        this.userId = userId;
        this.password = password;
    };

    public mocked = () => this.userId === MOCK && this.password === MOCK;

    public login = async (
        userId: string,
        password: string,
    ): Promise<{
        userId: string;
        password: string;
    }> => login(this, userId, password);

    public getFullName = async (): Promise<string> => getFullName(this);

    public logout = async (): Promise<void> => logout(this);

    public getTicket = async (target: ValidTickets) => getTicket(this, target);

    public retryWrapper = async <R>(
        target: ValidTickets,
        operation: Promise<R>,
    ): Promise<R> => retryWrapper(this, target, operation);

    public performGetTickets = () => {
        performGetTickets(this);
    };

    public getTickets = () => {
        getTickets(this);
    };

    public getReport = (
        graduate: boolean,
        bx: boolean,
        newGPA: boolean,
    ): Promise<Course[]> => getReport(this, graduate, bx, newGPA);

    public getAssessmentList = (): Promise<[string, boolean, string][]> =>
        getAssessmentList(this);

    public getAssessmentForm = (url: string): Promise<Form> =>
        getAssessmentForm(this, url);

    public postAssessmentForm = (form: Form): Promise<void> =>
        postAssessmentForm(this, form);

    public getPhysicalExamResult = (): Promise<[string, string][]> =>
        getPhysicalExamResult(this);

    public getJoggingRecord = (): Promise<JoggingRecord[]> =>
        getJoggingRecord(this);

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

    public getDormScore = async (): Promise<string> => getDormScore(this);

    public getEleRechargePayCode = async (money: number): Promise<string> =>
        getEleRechargePayCode(this, money);

    public getElePayRecord = async (): Promise<
        [string, string, string, string, string, string][]
        > => getElePayRecord(this);

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
    ): Promise<LibrarySeat[]> => getLibrarySeatList(librarySection, dateChoice);

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

    public getNewsList = async (
        url: string,
        channel: sourceTag,
    ): Promise<newsSlice[]> => getNewsList(this, url, channel);

    public getNewsDetail = async (
        url: string,
    ): Promise<[string, string, string]> => getNewsDetail(this, url);

    public getSchedule = async (graduate: boolean) => getSchedule(this, graduate);

    public getSecondary = async () => getSecondary(this);

    public getSecondaryVerbose = async () => getSecondaryVerbose(this);
}
