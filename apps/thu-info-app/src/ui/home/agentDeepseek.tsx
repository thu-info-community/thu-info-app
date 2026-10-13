import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type ReactNode,
} from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Keyboard,
	Modal,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	useColorScheme,
	useWindowDimensions,
	type TextInputInstance,
	View,
} from "react-native";
import {useSelector} from "react-redux";
import {useFocusEffect} from "@react-navigation/native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {agentService} from "../../agent/service";
import type {AgentRuntime} from "../../agent/runtime";
import type {SessionHeader} from "../../agent/types";
import {openAgentHandoff, sessionNeedsUnlock} from "../../agent/nativeTools";
import {navigationRef, State} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import type {DeepSeekTabProp} from "../../components/Root";
import {KeyboardAvoidingScreen} from "../../components/keyboardAvoidingScreen";
import {
	AgentAction,
	AgentMessageTurn,
	AgentWelcome,
	agentChatStyles,
} from "../../components/home/agentChat";
import {
	agentText,
	agentStatusText,
	operationStatusText,
	agentProgressText,
	groupAgentMessages,
	type AgentTurn,
} from "../../components/home/agentChatPresentation";
import IconHamburgerMenu from "../../assets/icons/IconHamburgerMenu";
import IconAdd from "../../assets/icons/IconAdd";
import IconConfig from "../../assets/icons/IconConfig";
import IconSend from "../../assets/icons/IconSend";
import IconDown from "../../assets/icons/IconDown";
import IconSearch from "../../assets/icons/IconSearch";
import IconLock from "../../assets/icons/IconLock";
import {campusModelName} from "../../utils/campusModel";

export {agentText} from "../../components/home/agentChatPresentation";
const noSubscription = () => () => {};
const zero = () => 0;

export const AgentDeepSeekScreen = ({
	route: {params},
}: {
	route: DeepSeekTabProp;
}) => {
	const [runtime, setRuntime] = useState<AgentRuntime>();
	const [input, setInput] = useState("");
	const [source, setSource] = useState<string | null>(null);
	const [history, setHistory] = useState<SessionHeader[]>([]);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [limit, setLimit] = useState(30);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [recordsExpanded, setRecordsExpanded] = useState(false);
	const [elapsed, setElapsed] = useState(0);
	const [usage, setUsage] = useState(0);
	const listRef = useRef<FlatList<AgentTurn>>(null);
	const inputRef = useRef<TextInputInstance>(null);
	const nearEnd = useRef(true);
	const config = useSelector((state: State) => state.config);
	const account = useSelector((state: State) => state.auth.userId);
	const {colors} = themes(useColorScheme());
	const insets = useSafeAreaInsets();
	const {fontScale, height} = useWindowDimensions();
	const styles = useMemo(() => agentChatStyles(fontScale), [fontScale]);
	useSyncExternalStore(
		runtime?.subscribe ?? noSubscription,
		runtime?.getRevision ?? zero,
	);
	const perform = async (action: () => Promise<unknown>) => {
		setBusy(true);
		setError("");
		try {
			await action();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Operation failed");
		} finally {
			setBusy(false);
		}
	};
	useFocusEffect(
		useCallback(() => {
			let disposed = false;
			if (account) {
				void agentService
					.open()
					.then((value) => {
						if (!disposed) {
							setRuntime(value);
							setError("");
						}
					})
					.catch((e) => {
						if (!disposed) {
							setError(String(e));
						}
					});
				void agentService
					.forAccount(account)
					.usage()
					.then((value) => {
						if (!disposed) {
							setUsage(value);
						}
					})
					.catch(() => {});
			}
			return () => {
				disposed = true;
			};
		}, [account]),
	);
	useEffect(() => {
		if (params) {
			setInput(params.prompt);
			setSource(params.dataSource);
		}
	}, [params]);
	useEffect(() => {
		let disposed = false;
		if (historyOpen && account) {
			void agentService
				.forAccount(account)
				.list(0, limit, search)
				.then((items) => {
					if (!disposed) {
						setHistory(items);
					}
				})
				.catch((e) => setError(String(e)));
		}
		return () => {
			disposed = true;
		};
	}, [historyOpen, account, search, limit]);
	const button = (
		label: string,
		action: () => void,
		disabled = false,
		primary = false,
	) => (
		<AgentAction
			label={label}
			onPress={action}
			disabled={disabled}
			primary={primary}
			colors={colors}
		/>
	);
	const checkpoint = runtime?.session.checkpoint;
	const running = runtime?.isRunning() ?? false;
	const turns = groupAgentMessages(runtime?.session.messages ?? []);
	useEffect(() => {
		if (!running) return;
		const started =
			[...(runtime?.session.messages ?? [])]
				.reverse()
				.find((message) => message.role === "user")?.timestamp ?? Date.now();
		setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
		const timer = setInterval(
			() => setElapsed(Math.floor((Date.now() - started) / 1000)),
			1000,
		);
		return () => clearInterval(timer);
	}, [running, runtime]);
	const pending =
		checkpoint?.approvals.filter((item) => !item.decision && !item.consumed) ??
		[];
	const approval = pending[0];
	useEffect(() => {
		if (approval?.id) Keyboard.dismiss();
	}, [approval?.id]);
	const ready =
		runtime?.session.header.account === account &&
		!!account &&
		!config.appLocked &&
		(!checkpoint || !sessionNeedsUnlock(checkpoint));
	const canSend =
		ready && config.agentEnabled && !running && !busy && !pending.length;
	const send = () => {
		if (!runtime || !canSend || !input.trim()) {
			return;
		}
		const request = input.trim();
		setInput("");
		void perform(() =>
			checkpoint?.pendingInput
				? runtime.answer(request)
				: runtime.send(request, config.agentThinking ?? "default", source),
		);
	};
	const open = (id?: string, create = false) =>
		void perform(async () => {
			nearEnd.current = true;
			setRuntime(await agentService.open(id, create));
			setHistoryOpen(false);
		});
	const iconButton = (
		label: string,
		icon: ReactNode,
		action: () => void,
		disabled = false,
	) => (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{disabled}}
			disabled={disabled}
			onPress={action}
			style={({pressed}) => [
				styles.iconButton,
				{
					backgroundColor: pressed ? colors.themeTransparentGrey : undefined,
					opacity: disabled ? 0.4 : 1,
				},
			]}>
			{icon}
		</Pressable>
	);
	const records = checkpoint?.operations.slice(-20) ?? [];
	const visibleRecords = recordsExpanded
		? records
		: records.filter(
				({status}) => status === "unknown" || status === "dispatching",
			);
	const needsResume =
		checkpoint &&
		["paused", "failed"].includes(checkpoint.status) &&
		!pending.length &&
		!checkpoint.pendingInput;
	const openDocument = (documentRoute: string) => {
		try {
			openAgentHandoff(documentRoute);
		} catch (e) {
			setError(String(e));
		}
	};
	const reconcile = (operationId: string) =>
		Alert.alert(
			agentText("Record your observation", "记录你查看到的结果"),
			agentText(
				"This records your observation only, and does not retry the operation.",
				"此操作仅记录你观察到的结果，不会重试。",
			),
			[
				{text: getStr("cancel"), style: "cancel"},
				{
					text: agentText("It succeeded", "已成功"),
					onPress: () => {
						void perform(() => runtime!.reconcile(operationId, "succeeded"));
					},
				},
				{
					text: agentText("It did not happen", "未执行成功"),
					onPress: () => {
						void perform(() => runtime!.reconcile(operationId, "failed"));
					},
				},
			],
		);
	if (!account || (!ready && runtime)) {
		return (
			<View
				style={[
					styles.centered,
					{backgroundColor: colors.themeBackground, paddingTop: insets.top},
				]}>
				<IconLock width={40} height={40} />
				<Text
					accessibilityRole="header"
					style={[styles.panelTitle, {color: colors.fontB0}]}>
					{account
						? agentText("Unlock this conversation", "解锁后查看对话")
						: getStr("deepseek")}
				</Text>
				<Text
					style={[
						styles.panelBody,
						{color: colors.fontB2, textAlign: "center"},
					]}>
					{agentText(
						"Sign in and unlock protected data to view this conversation.",
						"请登录并解锁受保护的数据后查看对话。",
					)}
				</Text>
				{button(
					account ? agentText("Unlock", "解锁") : getStr("login"),
					() =>
						account
							? navigationRef.navigate("DigitalPassword", {
									action: "verify",
									target: "RootTabs",
								})
							: navigationRef.navigate("Login"),
					false,
					true,
				)}
			</View>
		);
	}
	return (
		<KeyboardAvoidingScreen
			style={{
				flex: 1,
				paddingTop: insets.top,
				backgroundColor: colors.themeBackground,
			}}
			keyboardVerticalOffset={0}>
			<View style={[styles.column, styles.header]}>
				{iconButton(
					agentText("History", "历史记录"),
					<IconHamburgerMenu width={24} height={24} />,
					() => setHistoryOpen(true),
				)}
				<View style={{flex: 1, minWidth: 0}}>
					<Text
						accessibilityRole="header"
						style={[styles.headerTitle, {color: colors.fontB0}]}>
						{getStr("deepseek")}
					</Text>
					<Text style={[styles.headerSubtitle, {color: colors.fontB2}]}>
						{campusModelName}
					</Text>
				</View>
				{iconButton(
					getStr("newConversation"),
					<IconAdd width={24} height={24} />,
					() => open(undefined, true),
					busy,
				)}
				{iconButton(
					getStr("settings"),
					<IconConfig width={24} height={24} />,
					() => navigationRef.navigate("DeepSeekSettings"),
				)}
			</View>
			{!config.agentEnabled && (
				<View
					style={[
						styles.column,
						styles.panel,
						{backgroundColor: colors.contentBackground},
					]}>
					<Text style={[styles.panelBody, {color: colors.fontB2}]}>
						{agentText(
							"Agent mode is disabled. History is still available; enable it in settings to continue.",
							"智能体模式已关闭。历史记录仍可查看，启用后可继续对话。",
						)}
					</Text>
					{button(getStr("settings"), () =>
						navigationRef.navigate("DeepSeekSettings"),
					)}
				</View>
			)}
			{usage >= 50 * 1024 * 1024 && (
				<View
					style={[styles.column, {paddingHorizontal: 24, paddingVertical: 8}]}>
					<Text style={[styles.caption, {color: colors.fontB2}]}>
						{`${(usage / 1024 / 1024).toFixed(1)} MiB · ${agentText(usage >= 100 * 1024 * 1024 ? "Large history: review storage in settings." : "History storage is growing; details can be cleared in settings.", "历史记录占用较大，可在设置中清理详情。")}`}
					</Text>
				</View>
			)}
			<FlatList
				ref={listRef}
				style={{flex: 1}}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
				onContentSizeChange={() => {
					if (nearEnd.current) listRef.current?.scrollToEnd({animated: false});
				}}
				onScroll={({nativeEvent}) => {
					nearEnd.current =
						nativeEvent.contentSize.height -
							nativeEvent.layoutMeasurement.height -
							nativeEvent.contentOffset.y <
						120;
				}}
				scrollEventThrottle={100}
				data={turns}
				keyExtractor={(item) => item.id}
				initialNumToRender={15}
				windowSize={7}
				contentContainerStyle={styles.listContent}
				renderItem={({item, index}) => (
					<AgentMessageTurn
						turn={item}
						colors={colors}
						bubbleMessage={!!config.bubbleMessage}
						active={running && index === turns.length - 1}
						onDocument={openDocument}
						onError={setError}
					/>
				)}
				ListEmptyComponent={
					runtime ? (
						<AgentWelcome
							colors={colors}
							disabled={!canSend}
							onSelect={(prompt) => {
								setInput(prompt);
								inputRef.current?.focus();
							}}
						/>
					) : error ? (
						<View style={styles.centered}>
							<Text
								accessibilityRole="header"
								style={[styles.panelTitle, {color: colors.fontB0}]}>
								{agentText(
									"Unable to load this conversation",
									"这条对话未能载入",
								)}
							</Text>
							<Text
								accessibilityRole="alert"
								selectable
								style={[styles.panelBody, {color: colors.fontB2}]}>
								{error}
							</Text>
							<Text style={[styles.panelBody, {color: colors.fontB2}]}>
								{agentText(
									"You can start a new conversation or choose another from history.",
									"可以直接新建对话，或从历史记录中选择其他对话。",
								)}
							</Text>
							<View style={styles.actionRow}>
								{button(
									getStr("newConversation"),
									() => open(undefined, true),
									busy,
									true,
								)}
								{button(agentText("Retry", "重试"), () => open(), busy)}
							</View>
						</View>
					) : (
						<View style={styles.centered}>
							<ActivityIndicator color={colors.themePurple} />
							<Text style={{color: colors.fontB2}}>{agentStatusText()}</Text>
						</View>
					)
				}
				ListFooterComponent={
					<View style={styles.footer}>
						{!!records.length && (
							<View>
								<Pressable
									accessibilityRole="button"
									accessibilityState={{expanded: recordsExpanded}}
									onPress={() => setRecordsExpanded(!recordsExpanded)}
									style={[styles.actionRow, {minHeight: 48}]}>
									<Text style={{color: colors.fontB2, fontSize: 13}}>
										{agentText("Action records", "操作记录")} · {records.length}
									</Text>
									<View
										style={{
											transform: [
												{rotate: recordsExpanded ? "180deg" : "0deg"},
											],
										}}>
										<IconDown width={18} height={18} />
									</View>
								</Pressable>
								{visibleRecords.map((operation) => (
									<View
										key={operation.id}
										style={[
											styles.panel,
											{
												backgroundColor: colors.contentBackground,
												marginBottom: 8,
											},
										]}>
										<Text
											style={[
												styles.panelTitle,
												{
													color:
														operation.status === "unknown" ||
														operation.status === "failed"
															? colors.statusWarning
															: colors.fontB0,
												},
											]}>
											{operationStatusText(operation.status)}
										</Text>
										<Text
											selectable
											style={[styles.caption, {color: colors.fontB2}]}>
											{operation.label || operation.tool}
										</Text>
										{!!operation.result && (
											<Text
												selectable
												style={[styles.panelBody, {color: colors.fontB1}]}>
												{operation.result}
											</Text>
										)}
										{operation.status === "unknown" &&
											button(
												agentText(
													"I checked the native record",
													"我已查看原生页面记录",
												),
												() => reconcile(operation.id),
												running || busy || !config.agentEnabled,
											)}
									</View>
								))}
							</View>
						)}
						{checkpoint?.pendingInput && (
							<View
								style={[
									styles.panel,
									{backgroundColor: colors.contentBackground},
								]}>
								<Text style={[styles.caption, {color: colors.themePurple}]}>
									{agentText("One more detail", "还需要一点信息")}
								</Text>
								<Text style={[styles.panelTitle, {color: colors.fontB0}]}>
									{checkpoint.pendingInput.question}
								</Text>
								<View style={styles.actionRow}>
									{checkpoint.pendingInput.choices?.map((choice) => (
										<AgentAction
											key={choice}
											colors={colors}
											label={choice}
											onPress={() => {
												void perform(() => runtime!.answer(choice));
											}}
											disabled={running || busy || !config.agentEnabled}
										/>
									))}
								</View>
							</View>
						)}
						{!!runtime && !!(error || checkpoint?.error) && (
							<View
								accessibilityRole="alert"
								style={[
									styles.panel,
									{backgroundColor: colors.statusWarningOpacity},
								]}>
								<Text style={[styles.panelTitle, {color: colors.fontB0}]}>
									{agentText("This request was interrupted", "这次请求中断了")}
								</Text>
								<Text
									selectable
									style={[styles.panelBody, {color: colors.fontB1}]}>
									{error || checkpoint?.error}
								</Text>
							</View>
						)}
						{checkpoint?.status === "completed" &&
							button(
								agentText("Regenerate answer", "重新生成回答"),
								() => {
									void perform(() => runtime!.regenerate());
								},
								busy || !config.agentEnabled,
							)}
					</View>
				}
			/>
			<View style={[styles.column, styles.composer]}>
				{approval && (
					<View
						accessibilityLabel={agentText("Action approval", "操作确认")}
						style={[
							styles.panel,
							{backgroundColor: colors.contentBackground, marginBottom: 12},
						]}>
						<View style={styles.actionRow}>
							<IconLock width={22} height={22} />
							<Text
								accessibilityRole="header"
								style={[styles.panelTitle, {color: colors.fontB0}]}>
								{agentText("Review this action", "需要你确认")}
							</Text>
							{pending.length > 1 && (
								<Text style={[styles.caption, {color: colors.fontB2}]}>
									{agentText(
										`${pending.length} remaining`,
										`还有 ${pending.length} 项`,
									)}
								</Text>
							)}
						</View>
						<ScrollView
							key={approval.id}
							style={{maxHeight: Math.max(100, height * 0.28)}}
							keyboardShouldPersistTaps="handled">
							<Text
								selectable
								style={[styles.panelBody, {color: colors.fontB1}]}>
								{approval.preview}
							</Text>
						</ScrollView>
						<Text style={[styles.caption, {color: colors.fontB2}]}>
							{agentText("Valid until", "有效期至")}{" "}
							{new Date(approval.expiresAt).toLocaleTimeString()}
						</Text>
						<View style={styles.actionRow}>
							{button(
								agentText("Approve once", "仅批准这一次"),
								() => {
									void perform(() => runtime!.respond(approval.id, true));
								},
								running || busy || !config.agentEnabled,
								true,
							)}
							{button(
								agentText("Reject", "拒绝"),
								() => {
									void perform(() => runtime!.respond(approval.id, false));
								},
								running || busy || !config.agentEnabled,
							)}
						</View>
					</View>
				)}
				{(running ||
					needsResume ||
					pending.length > 0 ||
					checkpoint?.pendingInput) && (
					<View style={styles.progress}>
						{running && (
							<ActivityIndicator size="small" color={colors.themePurple} />
						)}
						<Text
							accessibilityLiveRegion="polite"
							style={[styles.progressText, {color: colors.fontB2}]}>
							{agentProgressText(checkpoint)}
						</Text>
						{running && (
							<Text
								style={[
									styles.caption,
									{color: colors.fontB2, fontVariant: ["tabular-nums"]},
								]}>
								{elapsed}s
							</Text>
						)}
						{needsResume &&
							button(
								agentText("Continue safely", "继续"),
								() => {
									void perform(() => runtime!.resume());
								},
								busy || !config.agentEnabled,
							)}
					</View>
				)}
				<View
					style={[
						styles.composerField,
						{
							backgroundColor: colors.contentBackground,
							borderColor: colors.inputBorder,
						},
					]}>
					<TextInput
						ref={inputRef}
						accessibilityLabel={agentText("Message", "消息")}
						placeholder={
							checkpoint?.pendingInput
								? agentText("Add the missing details…", "补充一下…")
								: agentText("Ask your campus assistant…", "问点校园里的事…")
						}
						placeholderTextColor={colors.fontB3}
						selectionColor={colors.primary}
						underlineColorAndroid="transparent"
						value={input}
						onChangeText={setInput}
						multiline
						maxLength={12000}
						editable={ready && config.agentEnabled}
						style={[styles.input, {color: colors.text}]}
					/>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={
							running ? agentText("Stop", "停止") : agentText("Send", "发送")
						}
						accessibilityState={{
							disabled: !running && (!canSend || !input.trim()),
						}}
						disabled={!running && (!canSend || !input.trim())}
						onPress={
							running
								? () => {
										void perform(() => runtime!.stop());
									}
								: send
						}
						style={({pressed}) => [
							styles.sendButton,
							{
								backgroundColor:
									running || (canSend && input.trim())
										? colors.primaryLight
										: colors.themeTransparentGrey,
								opacity: pressed ? 0.7 : 1,
							},
						]}>
						{running ? (
							<View
								style={{
									width: 16,
									height: 16,
									borderRadius: 3,
									backgroundColor: "#FFFFFF",
								}}
							/>
						) : (
							<IconSend
								width={22}
								height={22}
								color={canSend && input.trim() ? "#FFFFFF" : colors.fontB2}
							/>
						)}
					</Pressable>
				</View>
			</View>
			<Modal
				visible={historyOpen}
				animationType="slide"
				onRequestClose={() => setHistoryOpen(false)}>
				<KeyboardAvoidingScreen
					keyboardVerticalOffset={0}
					style={{
						flex: 1,
						paddingTop: insets.top + 16,
						paddingBottom: insets.bottom,
						backgroundColor: colors.themeBackground,
					}}>
					<View style={styles.modalHeader}>
						<Text
							accessibilityRole="header"
							style={[styles.modalTitle, {color: colors.fontB0}]}>
							{agentText("Conversations", "对话记录")}
						</Text>
						{button(getStr("cancel"), () => setHistoryOpen(false))}
					</View>
					<View
						style={[
							styles.search,
							{
								backgroundColor: colors.contentBackground,
								borderColor: colors.inputBorder,
							},
						]}>
						<IconSearch width={20} height={20} />
						<TextInput
							accessibilityLabel={agentText(
								"Search conversation titles",
								"搜索对话标题",
							)}
							value={search}
							onChangeText={(value) => {
								setSearch(value);
								setLimit(30);
							}}
							placeholder={agentText("Search conversations", "搜索对话")}
							placeholderTextColor={colors.fontB3}
							selectionColor={colors.primary}
							underlineColorAndroid="transparent"
							style={[styles.searchInput, {color: colors.text}]}
						/>
					</View>
					<ScrollView
						keyboardShouldPersistTaps="handled"
						contentContainerStyle={{paddingBottom: 24}}>
						{!!error && (
							<View style={[styles.panel, {marginHorizontal: 16}]}>
								<Text
									accessibilityRole="alert"
									style={[styles.panelBody, {color: colors.fontB1}]}>
									{error}
								</Text>
								{button(
									getStr("newConversation"),
									() => open(undefined, true),
									busy,
									true,
								)}
							</View>
						)}
						{!history.length && (
							<Text
								style={[styles.panelBody, {color: colors.fontB2, padding: 28}]}>
								{search
									? agentText("No matching conversations", "没有匹配的对话")
									: agentText(
											"Your conversations will appear here.",
											"聊过的内容会保存在这里。",
										)}
							</Text>
						)}
						{history.map((header) => (
							<View
								key={header.id}
								style={[
									styles.historyRow,
									{
										borderBottomColor: colors.themeGrey,
										backgroundColor:
											header.id === runtime?.session.header.id
												? colors.themeTransparentPurple
												: colors.transparent,
									},
								]}>
								<Pressable
									accessibilityRole="button"
									accessibilityState={{
										selected: header.id === runtime?.session.header.id,
										disabled: busy,
									}}
									disabled={busy}
									onPress={() => open(header.id)}
									style={({pressed}) => [
										styles.historyEntry,
										{opacity: pressed || busy ? 0.5 : 1},
									]}>
									<Text
										numberOfLines={2}
										style={[styles.historyTitle, {color: colors.fontB0}]}>
										{header.title}
									</Text>
									<Text style={[styles.caption, {color: colors.fontB2}]}>
										{new Date(header.updatedAt).toLocaleDateString()} ·{" "}
										{agentStatusText(header.status)}
									</Text>
								</Pressable>
								{button(
									getStr("delete"),
									() =>
										Alert.alert(getStr("delete"), header.title, [
											{text: getStr("cancel"), style: "cancel"},
											{
												text: getStr("confirm"),
												style: "destructive",
												onPress: () => {
													void perform(async () => {
														await agentService.remove(header.id);
														setHistory(
															await agentService
																.forAccount()
																.list(0, limit, search),
														);
														if (header.id === runtime?.session.header.id)
															setRuntime(await agentService.open());
													});
												},
											},
										]),
									busy,
								)}
							</View>
						))}
						{history.length === limit &&
							button(agentText("Load more", "加载更多"), () =>
								setLimit(limit + 30),
							)}
					</ScrollView>
				</KeyboardAvoidingScreen>
			</Modal>
		</KeyboardAvoidingScreen>
	);
};
