import {useEffect, useMemo, useRef, useState} from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	useColorScheme,
} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import dayjs from "dayjs";
import type {RootNav} from "../../components/Root";
import {currState, helper, State} from "../../redux/store";
import {
	scheduleClearImportOverrides,
	scheduleFetch,
	scheduleImportCustomBatch,
} from "../../redux/slices/schedule";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {pickScheduleFile} from "../../utils/pickScheduleFile";
import {
	getImportRange,
	ImportIssueReason,
	ImportResult,
	parseScheduleICS,
	ScheduleImportError,
} from "../../utils/scheduleImport";
import {
	classifyImportRecords,
	ImportMode,
	ImportRecord,
	isInImportRange,
	scheduleRecords,
} from "../../utils/scheduleImportData";

const issueKeys = {
	invalid: "scheduleImportInvalidEvent",
	allDay: "scheduleImportAllDay",
	overnight: "scheduleImportOvernight",
	timezone: "scheduleImportTimezone",
	recurrence: "scheduleImportRecurrence",
	cancelled: "scheduleImportCancelled",
	outside: "scheduleImportOutside",
} as const;
const errorKeys = {
	invalidFile: "scheduleImportInvalidFile",
	fileTooLarge: "scheduleImportFileTooLarge",
	limit: "scheduleImportLimit",
	range: "scheduleImportRangeError",
	aborted: "cancel",
} as const;
type PreviewRow =
	| {
			kind: "record";
			record: ImportRecord & {status: "ready" | "duplicate" | "conflict"};
	  }
	| {kind: "issue"; name: string; reason: ImportIssueReason}
	| {kind: "affected"; record: ImportRecord};

export const ScheduleImportScreen = ({navigation}: {navigation: RootNav}) => {
	const theme = themes(useColorScheme());
	const {firstDay, weekCount, nextSemesterIndex} = useSelector(
		(s: State) => s.config,
	);
	const schedule = useSelector((s: State) => s.schedule);
	const dispatch = useDispatch();
	const [startDate, setStartDate] = useState(firstDay);
	const [endDate, setEndDate] = useState(
		dayjs(firstDay)
			.add(weekCount * 7 - 1, "day")
			.format("YYYY-MM-DD"),
	);
	const [mode, setMode] = useState<ImportMode>("append");
	const [file, setFile] = useState<{name: string; text: string} | null>(null);
	const [result, setResult] = useState<ImportResult | null>(null);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const task = useRef<AbortController | null>(null);
	const committing = useRef(false);
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			task.current?.abort();
		};
	}, []);
	const existing = useMemo(
		() => scheduleRecords(schedule.baseSchedule),
		[schedule.baseSchedule],
	);
	const range = useMemo(() => {
		try {
			return getImportRange(startDate, endDate);
		} catch {
			return null;
		}
	}, [startDate, endDate]);
	const affected =
		mode === "replace" && range
			? existing.filter((r) => isInImportRange(r.start, range))
			: [];
	const retained =
		mode === "replace" && range
			? existing.filter((r) => !isInImportRange(r.start, range))
			: existing;
	const classified = classifyImportRecords(result?.records ?? [], retained);
	const chosen = classified.filter(
		(r) => selected.has(r.id) && r.status !== "duplicate",
	);
	const rows: PreviewRow[] = [
		...classified.map((record): PreviewRow => ({kind: "record", record})),
		...(result?.issues ?? []).map((issue): PreviewRow => ({
			kind: "issue",
			...issue,
		})),
		...(result
			? affected.map((record): PreviewRow => ({kind: "affected", record}))
			: []),
	];
	const showError = (reason: unknown) =>
		setError(
			reason instanceof ScheduleImportError
				? getStr(errorKeys[reason.code])
				: getStr("scheduleImportReadError"),
		);
	const parse = async (chooseFile: boolean) => {
		if (task.current || !range) {
			return;
		}
		const controller = new AbortController();
		task.current = controller;
		setBusy(true);
		setError("");
		setResult(null);
		try {
			const input = chooseFile ? await pickScheduleFile() : file;
			if (!input || controller.signal.aborted) {
				return;
			}
			setFile(input);
			const parsed = await parseScheduleICS(input.text, {
				startDate,
				endDate,
				signal: controller.signal,
			});
			if (controller.signal.aborted) {
				return;
			}
			setResult(parsed);
			setSelected(new Set(parsed.records.map((record) => record.id)));
		} catch (reason) {
			if (!controller.signal.aborted) {
				showError(reason);
			}
		} finally {
			if (task.current === controller) {
				task.current = null;
			}
			if (mounted.current) {
				setBusy(false);
			}
		}
	};
	const confirmImport = () => {
		if (committing.current || !range || !result || chosen.length === 0) {
			return;
		}
		const snapshot = currState().schedule;
		const currentRecords = scheduleRecords(snapshot.baseSchedule);
		const currentAffected =
			mode === "replace"
				? currentRecords.filter((r) => isInImportRange(r.start, range))
				: [];
		const currentRetained =
			mode === "replace"
				? currentRecords.filter((r) => !isInImportRange(r.start, range))
				: currentRecords;
		const candidates = result.records.filter((r) => selected.has(r.id));
		const toImport = classifyImportRecords(candidates, currentRetained).filter(
			(r) => r.status !== "duplicate",
		);
		if (!toImport.length) {
			setError(getStr("scheduleImportNothing"));
			return;
		}
		const message = [
			`${startDate} → ${endDate}`,
			getStr("scheduleImportConfirmCount").replace(
				"{0}",
				String(toImport.length),
			),
			mode === "replace"
				? getStr("scheduleImportReplaceWarning").replace(
						"{0}",
						String(currentAffected.length),
					)
				: getStr("scheduleImportAppendHint"),
			result.issues.length
				? getStr("scheduleImportSkippedWarning").replace(
						"{0}",
						String(result.issues.length),
					)
				: "",
			toImport.some((r) => r.status === "conflict")
				? getStr("scheduleImportConflictHint")
				: "",
		]
			.filter(Boolean)
			.join("\n\n");
		Alert.alert(getStr("scheduleImportTitle"), message, [
			{text: getStr("cancel"), style: "cancel"},
			{
				text: getStr("confirm"),
				style: mode === "replace" ? "destructive" : "default",
				onPress: () => {
					if (!mounted.current || committing.current) {
						return;
					}
					// A refresh while the dialog is open can change the affected records.
					if (currState().schedule !== snapshot) {
						confirmImport();
						return;
					}
					committing.current = true;
					dispatch(scheduleImportCustomBatch({records: toImport, mode, range}));
					setResult(null);
					setFile(null);
					Alert.alert(
						getStr("done"),
						getStr("scheduleImportDone").replace(
							"{0}",
							String(toImport.length),
						),
						[{text: getStr("confirm"), onPress: () => navigation.goBack()}],
					);
					committing.current = false;
				},
			},
		]);
	};
	const restoreOfficial = () => {
		Alert.alert(
			getStr("scheduleImportRestore"),
			getStr("scheduleImportRestoreHint"),
			[
				{text: getStr("cancel"), style: "cancel"},
				{
					text: getStr("confirm"),
					onPress: async () => {
						if (task.current) {
							return;
						}
						const controller = new AbortController();
						task.current = controller;
						setBusy(true);
						setError("");
						try {
							const fresh = await helper.getSchedule(nextSemesterIndex);
							if (controller.signal.aborted) {
								return;
							}
							const semester =
								nextSemesterIndex === undefined
									? fresh.calendar
									: (fresh.calendar.nextSemesterList[nextSemesterIndex] ??
										fresh.calendar);
							dispatch(scheduleClearImportOverrides());
							dispatch(
								scheduleFetch({
									schedule: fresh.schedule,
									semesterId: semester.semesterId,
								}),
							);
						} catch {
							if (!controller.signal.aborted) {
								setError(getStr("networkRetry"));
							}
						} finally {
							task.current = null;
							if (mounted.current) {
								setBusy(false);
							}
						}
					},
				},
			],
		);
	};
	const button = (label: string, onPress: () => void, disabled = false) => (
		<TouchableOpacity
			accessibilityRole="button"
			accessibilityState={{disabled}}
			disabled={disabled}
			onPress={onPress}
			style={{
				padding: 12,
				marginVertical: 4,
				borderRadius: 8,
				backgroundColor: theme.colors.themePurple,
				opacity: disabled ? 0.45 : 1,
			}}>
			<Text style={{color: "white", textAlign: "center"}}>{label}</Text>
		</TouchableOpacity>
	);
	if (Platform.OS !== "android" && Platform.OS !== "ios") {
		return null;
	}
	return (
		<FlatList
			style={{flex: 1, backgroundColor: theme.colors.contentBackground}}
			contentContainerStyle={{padding: 16}}
			data={rows}
			keyExtractor={(_, index) => String(index)}
			keyboardShouldPersistTaps="handled"
			ListHeaderComponent={
				<View>
					<Text style={{color: theme.colors.text, marginBottom: 12}}>
						{getStr("scheduleImportIntro")}
					</Text>
					<Text style={{color: theme.colors.fontB3}}>
						{getStr("scheduleImportRangeHint")}
					</Text>
					{(["start", "end"] as const).map((key) => (
						<View key={key} style={{marginVertical: 6}}>
							<Text style={{color: theme.colors.text}}>
								{getStr(
									key === "start" ? "scheduleImportStart" : "scheduleImportEnd",
								)}
							</Text>
							<TextInput
								accessibilityLabel={getStr(
									key === "start" ? "scheduleImportStart" : "scheduleImportEnd",
								)}
								value={key === "start" ? startDate : endDate}
								editable={!busy}
								placeholder="YYYY-MM-DD"
								autoCapitalize="none"
								onChangeText={(value) => {
									key === "start" ? setStartDate(value) : setEndDate(value);
									setResult(null);
								}}
								style={{
									color: theme.colors.text,
									borderColor: theme.colors.inputBorder,
									borderWidth: 1,
									borderRadius: 6,
									padding: 10,
								}}
							/>
						</View>
					))}
					{!range && (
						<Text style={{color: "#b3261e"}}>
							{getStr("scheduleImportRangeError")}
						</Text>
					)}
					<View
						accessibilityRole="radiogroup"
						style={{flexDirection: "row", gap: 8, marginVertical: 8}}>
						{(["append", "replace"] as const).map((value) => (
							<TouchableOpacity
								key={value}
								accessibilityRole="radio"
								accessibilityState={{checked: mode === value, disabled: busy}}
								disabled={busy}
								onPress={() => setMode(value)}
								style={{
									flex: 1,
									padding: 12,
									borderWidth: 1,
									borderRadius: 8,
									borderColor: theme.colors.themePurple,
									backgroundColor:
										mode === value ? theme.colors.themePurple : "transparent",
								}}>
								<Text
									style={{color: mode === value ? "white" : theme.colors.text}}>
									{getStr(
										value === "append"
											? "scheduleImportAppend"
											: "scheduleImportReplace",
									)}
								</Text>
							</TouchableOpacity>
						))}
					</View>
					<Text
						style={{
							color: mode === "replace" ? "#b3261e" : theme.colors.fontB3,
						}}>
						{getStr(
							mode === "replace"
								? "scheduleImportReplaceHint"
								: "scheduleImportAppendHint",
						)}
					</Text>
					{button(
						getStr("scheduleImportChoose"),
						() => {
							parse(true);
						},
						busy || !range,
					)}
					{file && <Text style={{color: theme.colors.text}}>{file.name}</Text>}
					{file &&
						!result &&
						button(
							getStr("scheduleImportPreview"),
							() => {
								parse(false);
							},
							busy || !range,
						)}
					{busy && (
						<ActivityIndicator
							accessibilityLabel={getStr("scheduleImportLoading")}
						/>
					)}
					{busy &&
						button(getStr("cancel"), () => {
							task.current?.abort();
						})}
					{!!error && (
						<Text
							accessibilityRole="alert"
							style={{color: "#b3261e", marginVertical: 8}}>
							{error}
						</Text>
					)}
					{result && (
						<>
							<Text style={{color: theme.colors.text, marginVertical: 12}}>
								{getStr("scheduleImportSummary")
									.replace("{0}", String(chosen.length))
									.replace(
										"{1}",
										String(
											classified.filter((r) => r.status === "duplicate").length,
										),
									)
									.replace("{2}", String(result.issues.length))
									.replace("{3}", String(affected.length))}
							</Text>
							{result.floatingTime && (
								<Text style={{color: theme.colors.fontB3}}>
									{getStr("scheduleImportFloating")}
								</Text>
							)}
							{button(
								getStr("scheduleImportConfirm"),
								confirmImport,
								busy || chosen.length === 0,
							)}
						</>
					)}
					{(schedule.replacementRanges ?? []).length > 0 && (
						<View style={{marginVertical: 12}}>
							<Text style={{color: theme.colors.text}}>
								{getStr("scheduleImportOverrides")}
							</Text>
							{schedule.replacementRanges!.map((r) => (
								<Text key={r.start} style={{color: theme.colors.fontB3}}>
									{dayjs(r.start).format("YYYY-MM-DD")} →{" "}
									{dayjs(r.end).subtract(1, "day").format("YYYY-MM-DD")}
								</Text>
							))}
							{button(getStr("scheduleImportRestore"), restoreOfficial, busy)}
						</View>
					)}
				</View>
			}
			renderItem={({item}) => {
				if (item.kind === "issue") {
					return (
						<View style={{paddingVertical: 10}}>
							<Text style={{color: theme.colors.text}}>
								{item.name || getStr("scheduleImportUnnamed")}
							</Text>
							<Text style={{color: "#b3261e"}}>
								{getStr(issueKeys[item.reason])}
							</Text>
						</View>
					);
				}
				const record = item.record;
				const status = item.kind === "record" ? item.record.status : undefined;
				const disabled =
					item.kind === "affected" || status === "duplicate" || busy;
				return (
					<TouchableOpacity
						accessibilityRole="checkbox"
						accessibilityState={{
							checked:
								item.kind === "record" &&
								selected.has(record.id) &&
								status !== "duplicate",
							disabled,
						}}
						disabled={disabled}
						onPress={() =>
							setSelected((previous) => {
								const next = new Set(previous);
								next.has(record.id)
									? next.delete(record.id)
									: next.add(record.id);
								return next;
							})
						}
						style={{
							paddingVertical: 12,
							borderBottomWidth: 1,
							borderColor: theme.colors.inputBorder,
						}}>
						<Text style={{color: theme.colors.text}}>
							{item.kind === "record" && status !== "duplicate"
								? selected.has(record.id)
									? "☑ "
									: "☐ "
								: ""}
							{record.name}
						</Text>
						<Text style={{color: theme.colors.fontB3}}>
							{dayjs(record.start).format("YYYY-MM-DD HH:mm")} –{" "}
							{dayjs(record.end).format("HH:mm")} {record.location}
						</Text>
						{item.kind === "affected" ? (
							<Text style={{color: "#b3261e"}}>
								{getStr("scheduleImportAffected")}
							</Text>
						) : (
							status !== "ready" && (
								<Text style={{color: "#b3261e"}}>
									{getStr(
										status === "duplicate"
											? "scheduleImportDuplicate"
											: "scheduleImportConflictHint",
									)}
								</Text>
							)
						)}
					</TouchableOpacity>
				);
			}}
		/>
	);
};
