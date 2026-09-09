import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Linking,
	Modal,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	useColorScheme,
	View,
} from "react-native";
import {useSelector} from "react-redux";
import {useFocusEffect} from "@react-navigation/native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import Clipboard from "@react-native-clipboard/clipboard";
import {agentService} from "../../agent/service";
import type {AgentRuntime} from "../../agent/runtime";
import type {Message, SessionHeader} from "../../agent/types";
import {openAgentHandoff, sessionNeedsUnlock} from "../../agent/nativeTools";
import {helper, navigationRef, State} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {getStr, langCode} from "../../utils/i18n";
import type {DeepSeekTabProp} from "../../components/Root";
import {KeyboardAvoidingScreen} from "../../components/keyboardAvoidingScreen";
import {presentMessage} from "../../agent/context";

export const agentText = (en: string, zh: string) =>
	langCode === "zh" ? zh : en;
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
	const [showReasoning, setShowReasoning] = useState(false);
	const [usage, setUsage] = useState(0);
	const [sources, setSources] = useState<{id: string; title: string}[] | null>(
		null,
	);
	const listRef = useRef<FlatList<Message>>(null);
	const nearEnd = useRef(true);
	const config = useSelector((state: State) => state.config);
	const account = useSelector((state: State) => state.auth.userId);
	const {colors} = themes(useColorScheme());
	const insets = useSafeAreaInsets();
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
	const button = (label: string, action: () => void, disabled = false) => (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{disabled}}
			disabled={disabled}
			onPress={action}
			style={{padding: 10, opacity: disabled ? 0.4 : 1}}>
			<Text style={{color: colors.themePurple}}>{label}</Text>
		</Pressable>
	);
	const checkpoint = runtime?.session.checkpoint;
	const running = runtime?.isRunning() ?? false;
	const pending =
		checkpoint?.approvals.filter((item) => !item.decision && !item.consumed) ??
		[];
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
	if (!ready && runtime) {
		return (
			<View style={{padding: 20}}>
				<Text style={{color: colors.text}}>
					{agentText(
						"Sign in and unlock protected data to view this conversation.",
						"请登录并解锁受保护的数据后查看对话。",
					)}
				</Text>
				{account &&
					button(agentText("Unlock", "解锁"), () =>
						navigationRef.navigate("DigitalPassword", {
							action: "verify",
							target: "RootTabs",
						}),
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
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}>
				{button(agentText("History", "历史"), () => setHistoryOpen(true))}
				<Text style={{color: colors.text, fontWeight: "600"}}>
					DeepSeek · Agent
				</Text>
				{button(getStr("newConversation"), () => open(undefined, true), busy)}
				{button(getStr("settings"), () =>
					navigationRef.navigate("DeepSeekSettings"),
				)}
			</View>
			{!config.agentEnabled && (
				<Text style={{color: colors.fontB3, padding: 12}}>
					{agentText(
						"Agent mode is disabled. History is still available; enable it in settings to continue.",
						"智能体模式已关闭。历史记录仍可查看，启用后可继续对话。",
					)}
				</Text>
			)}
			{usage >= 50 * 1024 * 1024 && (
				<Text
					style={{
						color: colors.statusWarning,
						padding: 8,
					}}>{`${(usage / 1024 / 1024).toFixed(1)} MiB · ${agentText(usage >= 100 * 1024 * 1024 ? "Large history: review storage in settings." : "History storage is growing; details can be cleared in settings.", "历史记录占用较大，可在设置中清理详情。")}`}</Text>
			)}
			<View style={{flexDirection: "row", alignItems: "center"}}>
				{button(
					agentText("News source", "新闻来源"),
					() =>
						void perform(async () => {
							setSources(await helper.getNewsChannelList(langCode !== "zh"));
						}),
					running || busy || !account,
				)}
				{!source && (
					<Text style={{color: colors.fontB3}}>
						{agentText("Auto", "自动")}
					</Text>
				)}
			</View>
			{source && (
				<View style={{flexDirection: "row", alignItems: "center"}}>
					<Text style={{color: colors.text, paddingLeft: 12}}>
						{agentText("News source", "新闻来源")}: {source}
					</Text>
					{button("×", () => setSource(null), running)}
				</View>
			)}
			<Text style={{color: colors.fontB3, paddingHorizontal: 12, fontSize: 12}}>
				{agentText("Thinking", "思考强度")}: {config.agentThinking ?? "default"}{" "}
				· {checkpoint?.status ?? "loading"} · {checkpoint?.compactions ?? 0}{" "}
				{agentText("compactions", "次压缩")}
			</Text>
			<FlatList
				ref={listRef}
				onContentSizeChange={() => {
					if (nearEnd.current) {
						listRef.current?.scrollToEnd({animated: false});
					}
				}}
				onScroll={({nativeEvent}) => {
					nearEnd.current =
						nativeEvent.contentSize.height -
							nativeEvent.layoutMeasurement.height -
							nativeEvent.contentOffset.y <
						120;
				}}
				scrollEventThrottle={100}
				data={runtime?.session.messages ?? []}
				keyExtractor={(item, index) => item.id ?? String(index)}
				initialNumToRender={15}
				windowSize={7}
				contentContainerStyle={{padding: 12, gap: 12}}
				renderItem={({item}) => {
					const visible = presentMessage(item);
					return (
						<View
							style={{
								padding: 12,
								borderRadius: 12,
								backgroundColor:
									item.role === "user" && config.bubbleMessage
										? colors.contentBackground
										: undefined,
							}}>
							<Text style={{color: colors.fontB3, fontSize: 12}}>
								{item.role === "user" ? agentText("You", "你") : "DeepSeek"}
							</Text>
							{!!visible.reasoning && (
								<>
									{button(agentText("Thinking details", "思考详情"), () =>
										setShowReasoning(!showReasoning),
									)}
									{showReasoning && (
										<Text selectable style={{color: colors.fontB3}}>
											{visible.reasoning}
										</Text>
									)}
								</>
							)}
							<Markdown
								rules={{image: () => null}}
								style={{
									body: {color: colors.text},
									link: {color: colors.themePurple},
								}}
								onLinkPress={(url) => {
									if (/^https?:\/\//i.test(url)) {
										Alert.alert(agentText("Open source", "打开来源"), url, [
											{text: getStr("cancel")},
											{
												text: getStr("confirm"),
												onPress: () => {
													void Linking.openURL(url).catch((e) =>
														setError(String(e)),
													);
												},
											},
										]);
									}
									return false;
								}}>
								{visible.text}
							</Markdown>
							{item.documents?.map((document) => (
								<View key={document.tool}>
									{button(agentText("Open document", "打开文档"), () => {
										try {
											openAgentHandoff(document.route);
										} catch (e) {
											setError(String(e));
										}
									})}
								</View>
							))}
							{!!visible.text &&
								button(agentText("Copy", "复制"), () =>
									Clipboard.setString(visible.text),
								)}
						</View>
					);
				}}
				ListEmptyComponent={
					<Text style={{color: colors.fontB3, padding: 20}}>
						{agentText(
							"Ask about your campus data or request an action. Bookings, course changes and other consequential writes require your approval. Never paste passwords or captchas.",
							"可以查询校园信息或请求执行操作。预约、选课等重要操作需要确认。请勿在对话中输入密码或验证码。",
						)}
					</Text>
				}
				ListFooterComponent={
					<View style={{gap: 10}}>
						{checkpoint?.operations.slice(-20).map((operation) => (
							<View
								key={operation.id}
								style={{
									backgroundColor: colors.contentBackground,
									padding: 12,
									borderRadius: 8,
								}}>
								<Text
									selectable
									style={{
										color:
											operation.status === "unknown"
												? colors.statusWarning
												: colors.text,
									}}>
									{operation.tool} · {operation.status}
									{"\n"}
									{operation.result}
								</Text>
								{operation.status === "unknown" &&
									button(
										agentText(
											"I checked the native record",
											"我已查看原生页面记录",
										),
										() =>
											Alert.alert(
												agentText(
													"Record your observation",
													"记录你查看到的结果",
												),
												agentText(
													"This records your observation only, and does not retry the operation.",
													"此操作仅记录你观察到的结果，不会重试。",
												),
												[
													{text: getStr("cancel"), style: "cancel"},
													{
														text: agentText("It succeeded", "已成功"),
														onPress: () =>
															void perform(() =>
																runtime!.reconcile(operation.id, "succeeded"),
															),
													},
													{
														text: agentText("It did not happen", "未执行成功"),
														onPress: () =>
															void perform(() =>
																runtime!.reconcile(operation.id, "failed"),
															),
													},
												],
											),
										running || busy || !config.agentEnabled,
									)}
							</View>
						))}
						{pending.map((approval) => (
							<View
								key={approval.id}
								style={{
									borderWidth: 1,
									borderColor: colors.themePurple,
									padding: 12,
									borderRadius: 8,
								}}>
								<Text style={{color: colors.text, fontWeight: "600"}}>
									{agentText("Review action", "确认操作")}
								</Text>
								<Text selectable style={{color: colors.text}}>
									{approval.preview}
								</Text>
								<Text style={{color: colors.fontB3}}>
									{agentText("Valid until", "有效期至")}:{" "}
									{new Date(approval.expiresAt).toLocaleTimeString()}
								</Text>
								<View style={{flexDirection: "row"}}>
									{button(
										agentText("Approve once", "仅批准这一次"),
										() =>
											void perform(() => runtime!.respond(approval.id, true)),
										running || busy || !config.agentEnabled,
									)}
									{button(
										agentText("Reject", "拒绝"),
										() =>
											void perform(() => runtime!.respond(approval.id, false)),
										running || busy || !config.agentEnabled,
									)}
								</View>
							</View>
						))}
						{checkpoint?.pendingInput && (
							<View
								style={{
									padding: 12,
									backgroundColor: colors.contentBackground,
								}}>
								<Text style={{color: colors.text}}>
									{checkpoint.pendingInput.question}
								</Text>
								{checkpoint.pendingInput.choices?.map((choice) => (
									<View key={choice}>
										{button(
											choice,
											() => void perform(() => runtime!.answer(choice)),
											running || busy || !config.agentEnabled,
										)}
									</View>
								))}
							</View>
						)}
						{(error || checkpoint?.error) && (
							<Text
								selectable
								accessibilityRole="alert"
								style={{color: colors.statusWarning}}>
								{error || checkpoint?.error}
							</Text>
						)}
						{running && <ActivityIndicator color={colors.themePurple} />}
						{running
							? button(
									agentText("Stop", "停止"),
									() => void perform(() => runtime!.stop()),
								)
							: checkpoint &&
								  ["paused", "failed"].includes(checkpoint.status) &&
								  !pending.length &&
								  !checkpoint.pendingInput
								? button(
										agentText("Continue safely", "继续"),
										() => void perform(() => runtime!.resume()),
										busy || !config.agentEnabled,
									)
								: null}
						{checkpoint?.status === "completed" &&
							button(
								agentText(
									"Regenerate answer (no writes)",
									"重新生成回答（不重复操作）",
								),
								() => void perform(() => runtime!.regenerate()),
								busy || !config.agentEnabled,
							)}
					</View>
				}
			/>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					padding: 10,
					gap: 6,
				}}>
				<TextInput
					accessibilityLabel={agentText("Message", "消息")}
					placeholder={agentText("What would you like to do?", "需要做什么？")}
					placeholderTextColor={colors.fontB3}
					value={input}
					onChangeText={setInput}
					multiline
					maxLength={12000}
					style={{
						flex: 1,
						maxHeight: 140,
						borderRadius: 12,
						padding: 12,
						color: colors.text,
						backgroundColor: colors.contentBackground,
					}}
				/>
				{button(agentText("Send", "发送"), send, !canSend || !input.trim())}
			</View>
			<Modal
				visible={sources !== null}
				animationType="slide"
				onRequestClose={() => setSources(null)}>
				<ScrollView
					contentContainerStyle={{padding: 16, paddingTop: insets.top + 16}}
					style={{backgroundColor: colors.themeBackground}}>
					{button(getStr("cancel"), () => setSources(null))}
					{button(agentText("Auto", "自动"), () => {
						setSource(null);
						setSources(null);
					})}
					{sources?.map((item) => (
						<View key={item.id}>
							{button(item.title, () => {
								setSource(item.id);
								setSources(null);
							})}
						</View>
					))}
				</ScrollView>
			</Modal>
			<Modal
				visible={historyOpen}
				animationType="slide"
				onRequestClose={() => setHistoryOpen(false)}>
				<KeyboardAvoidingScreen
					keyboardVerticalOffset={0}
					style={{
						flex: 1,
						padding: 16,
						paddingTop: insets.top + 16,
						backgroundColor: colors.themeBackground,
					}}>
					{button(getStr("cancel"), () => setHistoryOpen(false))}
					<TextInput
						accessibilityLabel={agentText(
							"Search conversation titles",
							"搜索对话标题",
						)}
						value={search}
						onChangeText={setSearch}
						placeholder={agentText(
							"Search conversation titles",
							"搜索对话标题",
						)}
						placeholderTextColor={colors.fontB3}
						style={{color: colors.text, padding: 12}}
					/>
					<ScrollView>
						{history.map((header) => (
							<View
								key={header.id}
								style={{flexDirection: "row", alignItems: "center"}}>
								<View style={{flex: 1}}>
									{button(header.title, () => open(header.id), busy)}
									<Text style={{color: colors.fontB3}}>
										{new Date(header.updatedAt).toLocaleString()} ·{" "}
										{header.status}
									</Text>
								</View>
								{button(
									getStr("delete"),
									() =>
										Alert.alert(getStr("delete"), header.title, [
											{text: getStr("cancel")},
											{
												text: getStr("confirm"),
												style: "destructive",
												onPress: () =>
													void perform(async () => {
														await agentService.remove(header.id);
														setHistory(
															await agentService
																.forAccount()
																.list(0, limit, search),
														);
														setRuntime(await agentService.open());
													}),
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
