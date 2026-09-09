import dayjs from "dayjs";
import {agentBindings, agentCatalog} from "@thu-info/lib/src/agent";
import type {ToolDescriptor} from "@thu-info/lib/src/agent";
import type {InfoHelper} from "@thu-info/lib";
import type {LibrarySection, LibrarySeat, LibRoomRes} from "@thu-info/lib/src/models/home/library";
import {ScheduleType} from "@thu-info/lib/src/models/schedule/schedule";
import {currState, helper, navigationRef, store} from "../redux/store";
import {scheduleAddCustom, scheduleSync} from "../redux/slices/schedule";
import {deepseekInvalidateNews} from "../redux/slices/deepseek";
import {
	setActiveLibBookRecord,
	setActiveSportsReservationRecord,
} from "../redux/slices/reservation";
import type {AgentCheckpoint, ToolContext} from "./types";
import {createScheduleFromToolArgs, scheduleId} from "./schedules";
import {AgentToolError, byteLength, canonical, sanitize} from "./util";

export const sessionNeedsUnlock = (checkpoint: AgentCheckpoint) => {
	const config = currState().config;
	return (
		!config.subFunctionUnlocked &&
		(checkpoint.protectedTools ?? []).some((name) => {
			const lock = agentCatalog.find((tool) => tool.name === name)?.lock;
			return lock === "report"
				? config.verifyPasswordBeforeEnterReport
				: lock === "finance"
					? config.verifyPasswordBeforeEnterFinance
					: lock === "physicalExam"
						? config.verifyPasswordBeforeEnterPhysicalExam
						: false;
		})
	);
};

/** Navigation is an allowlist, not a model-supplied route or URL. No secret enters tool arguments. */
const handoffs = {
	Account: () => navigationRef.navigate("Account"),
	Evaluation: () => navigationRef.navigate("Evaluation"),
	Electricity: () => navigationRef.navigate("Electricity"),
	ResetDormPassword: () => navigationRef.navigate("ResetDormPassword"),
	Sports: () => navigationRef.navigate("Sports"),
	SportsRecord: () => navigationRef.navigate("SportsRecord"),
	ReservesLibWelcome: () => navigationRef.navigate("ReservesLibWelcome"),
	NetworkLogin: () => navigationRef.navigate("NetworkLogin"),
	ECard: () => navigationRef.navigate("ECard"),
	Invoice: () => navigationRef.navigate("Invoice"),
	SchoolCalendar: () => navigationRef.navigate("SchoolCalendar"),
	DormScore: () => navigationRef.navigate("DormScore"),
};

export const openAgentHandoff = (route: string) => {
	const config = currState().config;
	if (!currState().auth.userId || config.appLocked) {
		throw new AgentToolError("Sign in and unlock the app first");
	}
	if (
		["Invoice", "ECard"].includes(route) &&
		config.verifyPasswordBeforeEnterFinance &&
		!config.subFunctionUnlocked
	) {
		navigationRef.navigate("DigitalPassword", {
			action: "verify",
			target: route === "Invoice" ? "Invoice" : "ECard",
		});
		return;
	}
	if (!navigationRef.isReady() || !Object.prototype.hasOwnProperty.call(handoffs, route)) {
		throw new AgentToolError("The native screen is not available");
	}
	handoffs[route as keyof typeof handoffs]();
};

const requireTarget = <T>(
	value: T | undefined,
	message = "Target no longer exists; fetch the list again",
): T => {
	if (!value) {
		throw new AgentToolError(message);
	}
	return value;
};

export const createNativeToolContext = (
	account: string,
	newsSource: () => string | null | undefined = () => undefined,
): ToolContext => {
	// Only URLs returned by a portal list may be used for authenticated detail reads.
	// Deliberately transient: after restart/compaction the agent can fetch the list again.
	const newsURLs = new Set<string>();
	const assessmentURLs = new Set<string>();
	const members = new Map<number, {label: string; department: string}>();
	const rememberURLs = (value: unknown, urls: Set<string>) => {
		if (Array.isArray(value)) {
			value.forEach((item) => rememberURLs(item, urls));
		} else if (value && typeof value === "object") {
			for (const [key, item] of Object.entries(value)) {
				if (key === "url" && typeof item === "string" && item.length < 4096) {
					urls.add(item);
				} else if (typeof item === "object") {
					rememberURLs(item, urls);
				}
			}
			while (urls.size > 2000) {
				urls.delete(urls.values().next().value!);
			}
		}
	};
	const assertAccess = (tool?: ToolDescriptor) => {
		const state = currState();
		if (!account || helper.userId !== account || state.auth.userId !== account) {
			throw new AgentToolError("Account changed. Open a conversation for the signed-in account.");
		}
		if (state.config.appLocked || !state.config.agentEnabled) {
			throw new AgentToolError("Unlock the app and enable agent mode before continuing.");
		}
		const needsUnlock =
			tool?.lock === "report"
				? state.config.verifyPasswordBeforeEnterReport
				: tool?.lock === "finance"
					? state.config.verifyPasswordBeforeEnterFinance
					: tool?.lock === "physicalExam"
						? state.config.verifyPasswordBeforeEnterPhysicalExam
						: false;
		if (needsUnlock && !state.config.subFunctionUnlocked) {
			throw new AgentToolError(
				`Unlock the ${tool?.lock} screen using the app's security prompt, then continue.`,
			);
		}
	};
	const selectedSchedules = (ids: unknown) => {
		if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) {
			throw new AgentToolError("Select distinct schedule IDs from list_local_schedules");
		}
		return ids.map((id) =>
			requireTarget(
				currState().schedule.baseSchedule.find(
					(item) => item.type === ScheduleType.CUSTOM && scheduleId(item) === id,
				),
			),
		);
	};
	const buildSchedule = (args: Record<string, unknown>) =>
		requireTarget(
			createScheduleFromToolArgs(args, currState().config.firstDay, currState().config.weekCount),
			"Invalid or incomplete schedule date/time. Ask the user to clarify.",
		);
	const preview = async (tool: ToolDescriptor, args: Record<string, unknown>) => {
		assertAccess(tool);
		let target: unknown;
		switch (tool.name) {
			case "create_schedule":
				target = buildSchedule(args);
				break;
			case "delete_local_schedule":
				target = selectedSchedules([args.scheduleId]);
				break;
			case "saveCustomSchedule":
			case "deleteCustomSchedule":
				target = selectedSchedules(args.scheduleIds);
				break;
			case "bookLibrarySeat": {
				const seat = args.librarySeat as unknown as LibrarySeat;
				const section = args.section as unknown as LibrarySection;
				const fresh = requireTarget(
					(await helper.getLibrarySeatList(section, args.dateChoice as 0 | 1)).find(
						(item) => item.id === seat.id && item.valid,
					),
				);
				if (fresh.type !== seat.type || fresh.zhNameTrace !== seat.zhNameTrace) {
					throw new AgentToolError("Seat details changed; fetch availability again");
				}
				target = {
					date: dayjs().add(Number(args.dateChoice), "day").format("YYYY-MM-DD"),
					section: section.zhNameTrace,
					seat: fresh.zhNameTrace,
				};
				break;
			}
			case "cancelBooking":
				target = requireTarget(
					(await helper.getBookingRecords()).find((item) => item.delId === args.id),
				);
				break;
			case "cancelLibraryRoomBooking":
				target = requireTarget(
					(await helper.getLibraryRoomBookingRecord()).find((item) => item.uuid === args.uuid),
				);
				break;
			case "bookLibraryRoom": {
				const room = args.roomRes as unknown as LibRoomRes;
				const start = dayjs(String(args.start)),
					end = dayjs(String(args.end));
				if (
					!start.isValid() ||
					!end.isValid() ||
					!end.isAfter(start) ||
					!start.isAfter(dayjs()) ||
					start.format("YYYY-MM-DD") !== end.format("YYYY-MM-DD") ||
					start.minute() % 5 ||
					end.minute() % 5 ||
					start.second() ||
					end.second()
				) {
					throw new AgentToolError(
						"Room booking requires future times on one day, in five-minute increments",
					);
				}
				const fresh = requireTarget(
					(
						await helper.getLibraryRoomBookingResourceList(start.format("YYYYMMDD"), room.kindId)
					).find((item) => item.devId === room.devId),
				);
				const minutes = end.diff(start, "minute");
				const participantIds = [
					...new Set([helper.getLibraryRoomAccNo(), ...(args.memberList as number[])]),
				];
				if (participantIds.length < fresh.minUser || participantIds.length > fresh.maxUser) {
					throw new AgentToolError("The participant count does not meet the room's rules");
				}
				const participants = [];
				for (const id of participantIds) {
					if (id === helper.getLibraryRoomAccNo()) {
						participants.push({name: "Current user", account});
						continue;
					}
					const known = requireTarget(
						members.get(id),
						"Look up additional members by exact name before booking",
					);
					const verified = requireTarget(
						(await helper.fuzzySearchLibraryId(known.label)).find((member) => member.id === id),
					);
					participants.push({name: verified.label, department: verified.department, id});
				}
				if (
					minutes < fresh.minMinute ||
					minutes > fresh.maxMinute ||
					!fresh.openStart ||
					!fresh.openEnd ||
					start.format("HH:mm") < fresh.openStart ||
					end.format("HH:mm") > fresh.openEnd ||
					fresh.usage.some((use) => start.isBefore(dayjs(use.end)) && end.isAfter(dayjs(use.start)))
				) {
					throw new AgentToolError(
						"Room is unavailable for this time range; query availability again",
					);
				}
				target = {
					room: fresh.devName,
					kind: fresh.kindName,
					minMinutes: fresh.minMinute,
					maxMinutes: fresh.maxMinute,
					minUsers: fresh.minUser,
					maxUsers: fresh.maxUser,
					start: args.start,
					end: args.end,
					participants,
				};
				break;
			}
			case "selectCourse":
			case "deleteCourse":
			case "changeCourseWill":
			case "cancelCoursePF":
			case "setCoursePF": {
				const semester = String(args.semesterId);
				const stage = await helper.getCrCurrentStage(semester);
				const courses =
					tool.name === "selectCourse"
						? (await helper.searchCrCourses({semester, id: String(args.courseId)})).courses
						: await helper.getSelectedCourses(semester);
				const course = requireTarget(
					courses.find(
						(item) =>
							item.id === args.courseId &&
							(args.courseSeq === undefined || Number(item.seq) === Number(args.courseSeq)),
					),
				);
				target = {
					stage,
					semester,
					course: {
						id: course.id,
						seq: course.seq,
						name: course.name,
						time: course.time,
						teacher: course.teacher,
					},
				};
				break;
			}
			case "unsubscribeSportsReservation":
				target = requireTarget(
					(await helper.getSportsReservationRecords()).find((item) => item.bookId === args.bookId),
				);
				break;
			case "logoutNetworkDevice": {
				const device = args.device as Parameters<InfoHelper["logoutNetworkDevice"]>[0];
				target = requireTarget(
					(await helper.getOnlineDevices()).find((item) => canonical(item) === canonical(device)),
				);
				break;
			}
		}
		assertAccess(tool);
		const text = `${tool.description.split("\n")[0]}\n${tool.mode === "interactive" ? "Opens the native screen only; review and complete the operation there.\n" : ""}${JSON.stringify(sanitize({account, arguments: args, currentTarget: target}), null, 2)}`;
		// Never silently truncate recipients, body text, costs or booking targets in an approval.
		if (byteLength(text) > 24 * 1024) {
			throw new AgentToolError(
				"This action is too large to review safely in chat; use its native screen",
			);
		}
		return text;
	};
	return {
		account,
		assertAccess,
		prepare: preview,
		confirmationRequired: (tool, args) =>
			tool.name === "delete_local_schedule" &&
			selectedSchedules([args.scheduleId])[0].activeTime.base.length > 1,
		async invoke(tool, args) {
			assertAccess(tool);
			if (["getNewsList", "searchNewsList"].includes(tool.name) && newsSource()) {
				args = {...args, channel: newsSource()};
			}
			if (tool.mode === "interactive") {
				openAgentHandoff(requireTarget(tool.route));
				return {status: "handoff", route: tool.route, completed: false};
			}
			if (tool.result === "document") {
				const route = {
					getInvoicePDF: "Invoice",
					getCalendarImageUrl: "SchoolCalendar",
					getDormScore: "DormScore",
					getCampusCardPhotoUrl: "ECard",
				}[tool.name];
				return {
					document: true,
					route,
					instruction:
						"Use the Open document button to view this in the native screen. Binary content is not sent to the model.",
				};
			}
			switch (tool.name) {
				case "list_local_schedules":
					return currState().schedule.baseSchedule.map((item) => ({
						id: scheduleId(item),
						...(sanitize(item) as object),
					}));
				case "create_schedule": {
					const schedule = buildSchedule(args);
					store.dispatch(scheduleAddCustom(schedule));
					return {created: true, schedule: sanitize(schedule)};
				}
				case "delete_local_schedule": {
					selectedSchedules([args.scheduleId]);
					const state = currState().schedule;
					store.dispatch(
						scheduleSync({
							...state,
							baseSchedule: state.baseSchedule.filter(
								(item) => scheduleId(item) !== args.scheduleId,
							),
						}),
					);
					return {deleted: true};
				}
				case "saveCustomSchedule":
					return helper.saveCustomSchedule(selectedSchedules(args.scheduleIds));
				case "deleteCustomSchedule":
					return helper.deleteCustomSchedule(selectedSchedules(args.scheduleIds));
				case "bookLibraryRoom":
					return helper.bookLibraryRoom(
						args.roomRes as unknown as LibRoomRes,
						dayjs(String(args.start)).format("YYYY-MM-DD HH:mm:ss"),
						dayjs(String(args.end)).format("YYYY-MM-DD HH:mm:ss"),
						[...new Set([helper.getLibraryRoomAccNo(), ...(args.memberList as number[])])],
					);
				case "getNewsDetail": {
					if (!newsURLs.has(String(args.url))) {
						throw new AgentToolError(
							"Fetch a news list/search first and use an exact returned URL",
						);
					}
					const [title, , text] = await helper.getNewsDetail(String(args.url));
					return title === "PdF" || text === "PdF"
						? {
								document: true,
								source: args.url,
								instruction: "Open this article from the News tab to view its PDF.",
							}
						: {title, text, source: args.url};
				}
				case "getAssessmentForm": {
					if (!assessmentURLs.has(String(args.url))) {
						throw new AgentToolError(
							"Read the assessment list first and use an exact returned URL",
						);
					}
					const form = await helper.getAssessmentForm(String(args.url));
					return {
						overall: {score: form.overall.score.value, suggestion: form.overall.suggestion},
						teachers: form.teachers.map((person) => ({
							name: person.name,
							questions: person.inputGroups.map((group) => group.question),
						})),
						assistants: form.assistants.map((person) => ({
							name: person.name,
							questions: person.inputGroups.map((group) => group.question),
						})),
					};
				}
			}
			const binding = agentBindings[tool.name as keyof typeof agentBindings];
			if (!binding) {
				throw new AgentToolError("Tool has no reviewed binding");
			}
			const result = await binding(helper, args);
			if (["selectCourse", "deleteCourse", "changeCourseWill"].includes(tool.name)) {
				// These library methods return portal messages, including business failures.
				if (typeof result !== "string" || !result.includes("成功") || /失败|不成功/.test(result)) {
					return {status: "failed", message: sanitize(result)};
				}
				const selected = (await helper.getSelectedCourses(String(args.semesterId))).find(
					(item) => item.id === args.courseId && Number(item.seq) === Number(args.courseSeq),
				);
				const verified =
					tool.name === "deleteCourse"
						? !selected
						: tool.name === "changeCourseWill"
							? selected?.will === args.will
							: !!selected;
				return {
					status: verified ? "succeeded" : "unknown",
					message: sanitize(result),
					verified,
					instruction: verified
						? "Verified in selected courses"
						: "Do not repeat. Check the course registration screen for the outcome.",
				};
			}
			if (tool.name === "fuzzySearchLibraryId") {
				for (const member of result as Awaited<ReturnType<InfoHelper["fuzzySearchLibraryId"]>>) {
					members.set(member.id, {label: member.label, department: member.department});
				}
			}
			if (tool.name === "bookLibrarySeat") {
				const response = result as Awaited<ReturnType<InfoHelper["bookLibrarySeat"]>>;
				return {status: response.status === 1 ? "succeeded" : "failed", message: response.msg};
			}
			if (tool.category === "news" && tool.effect === "read") {
				rememberURLs(result, newsURLs);
			}
			if (tool.name === "getAssessmentList") {
				rememberURLs(result, assessmentURLs);
			}
			return result;
		},
		async onMutation(tool) {
			assertAccess(tool);
			if (tool.category === "news") {
				store.dispatch(deepseekInvalidateNews());
			}
			if (["bookLibrarySeat", "cancelBooking"].includes(tool.name)) {
				const records = await helper.getBookingRecords();
				assertAccess(tool);
				store.dispatch(setActiveLibBookRecord(records));
			} else if (tool.name === "unsubscribeSportsReservation") {
				const records = await helper.getSportsReservationRecords();
				assertAccess(tool);
				store.dispatch(setActiveSportsReservationRecord(records));
			}
		},
	};
};
