jest.mock("../../src/redux/store", () => {
	const state = {
		auth: {userId: "student"},
		config: {
			agentEnabled: true,
			appLocked: false,
			subFunctionUnlocked: false,
			verifyPasswordBeforeEnterFinance: true,
			firstDay: "2026-09-07",
			weekCount: 18,
		},
		schedule: {baseSchedule: [], customCnt: 1, shortenMap: {}},
	};
	return {
		currState: () => state,
		helper: {
			userId: "student",
			getNewsList: jest.fn(),
			getNewsDetail: jest.fn(),
			selectCourse: jest.fn(),
			getSelectedCourses: jest.fn(),
			getLibraryRoomBookingResourceList: jest.fn(),
			getLibraryRoomAccNo: () => 11,
			bookLibraryRoom: jest.fn(),
			getAssessmentList: jest.fn(),
			getAssessmentForm: jest.fn(),
		},
		store: {dispatch: jest.fn()},
		navigationRef: {isReady: () => true, navigate: jest.fn()},
	};
});
import {
	createNativeToolContext,
	openAgentHandoff,
	sessionNeedsUnlock,
} from "../../src/agent/nativeTools";
import {agentCatalog} from "@thu-info/lib/src/agent";
import {currState, helper, navigationRef} from "../../src/redux/store";
import {newCheckpoint} from "../../src/agent/storage";

const descriptor = (name: string) => agentCatalog.find((tool) => tool.name === name)!;
afterEach(() => {
	jest.clearAllMocks();
	currState().config.appLocked = false;
	currState().config.subFunctionUnlocked = false;
	helper.userId = "student";
});

test("native privacy locks apply to reads, previously read conversations and document buttons", () => {
	const context = createNativeToolContext("student");
	expect(() => context.assertAccess(descriptor("getBankPayment"))).toThrow("Unlock");
	const checkpoint = newCheckpoint();
	checkpoint.protectedTools = ["getBankPayment"];
	expect(sessionNeedsUnlock(checkpoint)).toBe(true);
	openAgentHandoff("Invoice");
	expect(navigationRef.navigate).toHaveBeenCalledWith("DigitalPassword", {
		action: "verify",
		target: "Invoice",
	});
	currState().config.subFunctionUnlocked = true;
	expect(sessionNeedsUnlock(checkpoint)).toBe(false);
	expect(() => context.assertAccess(descriptor("getBankPayment"))).not.toThrow();
	helper.userId = "another";
	expect(() => context.assertAccess()).toThrow("Account changed");
});

test("authenticated news reads require an observed source and never expose HTML or PDF bytes", async () => {
	const context = createNativeToolContext("student");
	await expect(
		context.invoke(descriptor("getNewsDetail"), {url: "https://attacker.invalid"}),
	).rejects.toThrow("exact returned URL");
	(helper.getNewsList as jest.Mock).mockResolvedValue([{url: "campus-source", name: "Title"}]);
	await context.invoke(descriptor("getNewsList"), {page: 1, length: 10});
	(helper.getNewsDetail as jest.Mock).mockResolvedValue([
		"Title",
		"<script>secret token</script>",
		"Readable article",
	]);
	expect(await context.invoke(descriptor("getNewsDetail"), {url: "campus-source"})).toEqual({
		title: "Title",
		text: "Readable article",
		source: "campus-source",
	});
	(helper.getNewsDetail as jest.Mock).mockResolvedValue(["PdF", "BASE64_BYTES", "PdF"]);
	expect(
		JSON.stringify(await context.invoke(descriptor("getNewsDetail"), {url: "campus-source"})),
	).not.toContain("BASE64_BYTES");
});

test("course business rejection is not reported as success; successful submissions are verified", async () => {
	const context = createNativeToolContext("student");
	const args = {
		semesterId: "2026-2027-1",
		courseId: "123",
		courseSeq: "01",
		priority: "rx",
		will: 1,
	};
	(helper.selectCourse as jest.Mock).mockResolvedValue("不在选课时间");
	expect(await context.invoke(descriptor("selectCourse"), args)).toMatchObject({status: "failed"});
	(helper.selectCourse as jest.Mock).mockResolvedValue("提交选课成功;");
	(helper.getSelectedCourses as jest.Mock).mockResolvedValue([]);
	expect(await context.invoke(descriptor("selectCourse"), args)).toMatchObject({status: "unknown"});
	(helper.getSelectedCourses as jest.Mock).mockResolvedValue([{id: "123", seq: "01"}]);
	expect(await context.invoke(descriptor("selectCourse"), args)).toMatchObject({
		status: "succeeded",
		verified: true,
	});
});

test("assessment wrappers omit hidden fields and secret-bearing class internals", async () => {
	const context = createNativeToolContext("student");
	(helper.getAssessmentList as jest.Mock).mockResolvedValue([{url: "assessment-source"}]);
	await context.invoke(descriptor("getAssessmentList"), {});
	(helper.getAssessmentForm as jest.Mock).mockResolvedValue({
		basics: [{value: "CSRF_SECRET"}],
		overall: {score: {value: "5", name: "hidden"}, suggestion: "Good"},
		teachers: [
			{name: "Teacher", inputGroups: [{question: "Question", others: [{value: "SECRET"}]}]},
		],
		assistants: [],
	});
	const result = await context.invoke(descriptor("getAssessmentForm"), {url: "assessment-source"});
	expect(result).toMatchObject({teachers: [{name: "Teacher", questions: ["Question"]}]});
	expect(JSON.stringify(result)).not.toMatch(/SECRET|hidden/);
});

test("secret and payment writes open allowlisted native screens without executing library writes", async () => {
	const context = createNativeToolContext("student");
	const result = await context.invoke(descriptor("getEleRechargePayCode"), {money: 100});
	expect(result).toEqual({status: "handoff", route: "Electricity", completed: false});
	expect(navigationRef.navigate).toHaveBeenCalledWith("Electricity");
	expect(() => openAgentHandoff("https://attacker.invalid")).toThrow("not available");
});

test("selected news source is enforced by the wrapper, not just prompt instructions", async () => {
	const context = createNativeToolContext("student", () => "LM_JWGG");
	(helper.getNewsList as jest.Mock).mockResolvedValue([]);
	await context.invoke(descriptor("getNewsList"), {page: 1, length: 10, channel: "LM_HB"});
	expect(helper.getNewsList).toHaveBeenCalledWith(1, 10, "LM_JWGG");
});
