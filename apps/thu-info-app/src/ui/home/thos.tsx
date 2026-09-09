import {KeyboardAvoidingScreen} from "../../components/keyboardAvoidingScreen";
import {ThemedRefreshControl} from "../../components/themedRefreshControl";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {
	ActivityIndicator,
	Alert,
	BackHandler,
	Linking,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	useWindowDimensions,
	StyleProp,
	ViewStyle,
	View,
} from "react-native";
import {useSelector} from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {WebView} from "react-native-webview";
import type {WebViewMessageEvent} from "react-native-webview";
import {helper, navigationRef, State} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import type {RootNav} from "../../components/Root";
import {
	THOS_BASE,
	thosPages,
	isThosAuthUrl,
	isThosUniversityUrl,
	routeThosUrl,
} from "@thu-info/lib/src/lib/thos-services";
import {USER_AGENT} from "@thu-info/lib/src/constants/strings";
import type {
	ThosCounts,
	ThosPage,
	ThosService,
	ThosTask,
	ThosTaskKind,
} from "@thu-info/lib/src/models/home/thos-services";
import IconRefreshNavBar from "../../assets/icons/IconRefreshNavBar";
import IconBrowser from "../../assets/icons/IconBrowser";
import IconStar from "../../assets/icons/IconStar";
import IconStarActive from "../../assets/icons/IconStarActive";

const getTaskLabel = (kind: ThosTaskKind): string => {
	switch (kind) {
		case "active":
			return getStr("thosActive");
		case "todo":
			return getStr("thosTodo");
		case "completed":
			return getStr("thosCompleted");
		case "drafts":
			return getStr("thosDrafts");
		case "unread":
			return getStr("thosUnread");
		case "phases":
			return getStr("thosPhases");
	}
};
export const getThosTaskStatusLabel = (status: string): string => {
	switch (status) {
		case "退回修改":
			return getStr("thosStatusReturned");
		case "待我处理":
			return getStr("thosStatusTodo");
		case "正在办理":
			return getStr("thosStatusOngoing");
		case "已办结":
			return getStr("thosStatusCompleted");
		case "办理成功":
			return getStr("thosStatusSuccess");
		case "办理失败":
			return getStr("thosStatusFailed");
		case "已撤回":
			return getStr("thosStatusWithdrawn");
		case "草稿":
			return getStr("thosStatusDraft");
		case "未阅":
			return getStr("thosStatusUnread");
		case "已阅":
			return getStr("thosStatusRead");
		case "待办理":
			return getStr("thosStatusPending");
		default: {
			const prefix = "任务已被";
			const suffix = "办理";
			if (status.startsWith(prefix) && status.endsWith(suffix))
				return getStr("thosStatusHandledBy").replace(
					"{0}",
					status.slice(prefix.length, -suffix.length),
				);
			return status;
		}
	}
};
export const getThosPhaseStateLabel = (state: string): string => {
	switch (state) {
		case "0":
			return getStr("thosStatusPending");
		case "1":
			return getStr("thosStatusOngoing");
		case "4":
			return getStr("thosStatusSuccess");
		case "5":
			return getStr("thosStatusFailed");
		default:
			return getStr("thosUnknownStatus");
	}
};
const primaryTaskKinds = ["active", "todo", "completed"] as const;
type TaskPages = Partial<Record<ThosTaskKind, ThosPage<ThosTask>>>;
export const ThosButton = ({
	title,
	onPress,
	selected = false,
	disabled = false,
	style,
}: {
	title: string;
	onPress: () => void;
	selected?: boolean;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
}) => {
	const {colors} = themes(useColorScheme());
	return (
		<TouchableOpacity
			accessibilityRole="button"
			disabled={disabled}
			onPress={onPress}
			style={[
				{
					minHeight: 44,
					paddingHorizontal: 14,
					paddingVertical: 11,
					borderRadius: 12,
					margin: 4,
					backgroundColor: selected
						? colors.mainTheme
						: colors.contentBackground,
					opacity: disabled ? 0.5 : 1,
				},
				style,
			]}>
			<Text
				style={{color: selected ? "white" : colors.text, fontWeight: "600"}}>
				{title}
			</Text>
		</TouchableOpacity>
	);
};
const Chip = ThosButton;

export const useThosBrowserHeader = (
	navigation: RootNav,
	onPress: () => void,
	disabled = false,
	visible = true,
) => {
	useEffect(() => {
		if (!navigation.setOptions) return;
		navigation.setOptions({
			headerRight: visible
				? () => (
						<TouchableOpacity
							testID="thos-open-website"
							accessibilityRole="button"
							accessibilityLabel={getStr("thosOpenWebsite")}
							disabled={disabled}
							onPress={onPress}
							style={{
								paddingHorizontal: 16,
								marginHorizontal: 4,
								opacity: disabled ? 0.5 : 1,
							}}>
							<IconBrowser width={24} height={24} />
						</TouchableOpacity>
					)
				: undefined,
		});
	}, [disabled, navigation, onPress, visible]);
};

export const ThosScreen = ({navigation}: {navigation: RootNav}) => {
	const {colors} = themes(useColorScheme());
	const {width: windowWidth} = useWindowDimensions();
	const [width, setWidth] = useState(windowWidth);
	const userId = useSelector((s: State) => s.auth.userId);
	const demo = helper.mocked();
	const [counts, setCounts] = useState<ThosCounts>();
	const [tasks, setTasks] = useState<TaskPages>({});
	const [services, setServices] = useState<ThosPage<ThosService>>();
	const [tab, setTab] = useState<ThosTaskKind | "services">("services");
	const [query, setQuery] = useState("");
	const [favorites, setFavorites] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const [updated, setUpdated] = useState<number>();
	const generation = useRef(0);
	const login = () =>
		navigationRef.isReady()
			? navigationRef.navigate("Login")
			: navigation.navigate("Login");
	const load = useCallback(async () => {
		if (!userId) return;
		const token = ++generation.current;
		setBusy(true);
		setError(undefined);
		setTasks({});
		setServices(undefined);
		setCounts(undefined);
		setUpdated(undefined);
		const alive = () => token === generation.current;
		try {
			const result = await helper.prepareThosSession();
			if (!alive()) return;
			setCounts(result);
			const warnings: string[] = [];
			for (const kind of [
				"todo",
				"active",
				"completed",
				"drafts",
				"unread",
				"phases",
			] as ThosTaskKind[]) {
				if (!alive()) return;
				try {
					const page = await helper.getThosTasks(kind);
					if (!alive()) return;
					setTasks((previous) => ({...previous, [kind]: page}));
				} catch {
					warnings.push(
						getStr("thosTaskLoadFailed").replace("{0}", getTaskLabel(kind)),
					);
				}
			}
			if (!alive()) return;
			try {
				const page = await helper.getThosServices();
				if (alive()) setServices(page);
			} catch {
				warnings.push(getStr("thosServiceDirectoryLoadFailed"));
			}
			if (alive()) {
				setUpdated(Date.now());
				setError(warnings.length ? warnings.join("\n") : undefined);
			}
		} catch {
			if (alive()) setError(getStr("thosConnectionError"));
		} finally {
			if (alive()) setBusy(false);
		}
	}, [userId]);
	useEffect(() => {
		const requestGeneration = generation;
		setCounts(undefined);
		setTasks({});
		setServices(undefined);
		setFavorites([]);
		setTab("services");
		setOnlyFavorites(false);
		setError(undefined);
		setUpdated(undefined);
		setBusy(false);
		let alive = true;
		if (userId)
			AsyncStorage.getItem(`thos-favorites:${userId}`)
				.then((raw) => {
					try {
						const value = JSON.parse(raw ?? "[]");
						if (alive && Array.isArray(value)) {
							const next = value.filter((x) => typeof x === "string");
							setFavorites(next);
							setOnlyFavorites(next.length > 0);
						}
					} catch {
						/* ignore invalid local preferences */
					}
				})
				.catch(() => {});
		load();
		return () => {
			alive = false;
			requestGeneration.current++;
		};
	}, [userId, load]);
	const open = useCallback(
		(url: string) => {
			if (!demo && url)
				navigation.navigate("ThosPortal", {url: routeThosUrl(url)});
		},
		[demo, navigation],
	);
	const openCurrentPage = useCallback(
		() => open(THOS_BASE + thosPages[tab]),
		[open, tab],
	);
	const favorite = (id: string) => {
		const next = favorites.includes(id)
			? favorites.filter((x) => x !== id)
			: [...favorites, id];
		setFavorites(next);
		if (onlyFavorites && next.length === 0) setOnlyFavorites(false);
		AsyncStorage.setItem(
			`thos-favorites:${userId}`,
			JSON.stringify(next),
		).catch(() => setError(getStr("thosFavoritesSaveFailed")));
	};
	const showServices = (quick: boolean) => {
		setTab("services");
		setOnlyFavorites(quick && favorites.length > 0);
		setQuery("");
	};
	const showTasks = (kind: ThosTaskKind) => {
		setTab(kind);
		setOnlyFavorites(false);
		setQuery("");
	};
	useThosBrowserHeader(navigation, openCurrentPage, demo);
	const rows = tab === "services" ? [] : (tasks[tab]?.items ?? []);
	const pending =
		tab === "todo"
			? [
					...rows,
					...(tasks.active?.items ?? []).filter(
						(x) =>
							["退回修改", "待我处理"].includes(x.status) &&
							!rows.some((item) => item.id === x.id),
					),
				]
			: rows;
	const taskRows = pending.filter((x) =>
		`${x.title} ${x.node} ${x.id} ${x.status} ${x.workflowStatus ?? ""} ${x.summary ?? ""}`
			.toLowerCase()
			.includes(query.toLowerCase()),
	);
	const serviceRows = (services?.items ?? []).filter(
		(x) =>
			(!onlyFavorites || favorites.includes(x.id)) &&
			`${x.name} ${x.department}`.toLowerCase().includes(query.toLowerCase()),
	);
	const page = tab === "services" ? services : tasks[tab];
	const complete = page?.complete && (tab !== "todo" || tasks.active?.complete);
	return (
		<KeyboardAvoidingScreen>
			<ScrollView
				testID="thos-dashboard"
				style={{flex: 1, backgroundColor: colors.themeBackground}}
				onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
				keyboardShouldPersistTaps="handled"
				refreshControl={
					<ThemedRefreshControl
						refreshing={busy}
						onRefresh={load}
					/>
				}
				contentContainerStyle={{
					padding: 16,
					paddingBottom: 40,
					maxWidth: 1100,
					width: "100%",
					alignSelf: "center",
				}}>
				{demo && (
					<Text style={{color: colors.statusWarning, marginVertical: 8}}>
						{getStr("thosDemoNotice")}
					</Text>
				)}
				{!userId ? (
					<Chip title={getStr("thosLogin")} onPress={login} />
				) : (
					<>
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								marginVertical: 10,
							}}>
							{primaryTaskKinds.map((kind) => (
								<TouchableOpacity
									key={kind}
									onPress={() => showTasks(kind)}
									style={{
										flex: 1,
										minWidth: 90,
										padding: 14,
										margin: 4,
										borderRadius: 12,
										alignItems: "center",
										backgroundColor:
											tab === kind ? colors.mainTheme : colors.contentBackground,
									}}>
									<Text
										style={{
											fontSize: 28,
											fontWeight: "700",
											color: tab === kind ? "white" : colors.mainTheme,
										}}>
										{counts?.[kind] ?? "—"}
									</Text>
									<Text
										style={{
											color: tab === kind ? "white" : colors.text,
											marginTop: 6,
										}}>
										{getTaskLabel(kind)}
									</Text>
								</TouchableOpacity>
							))}
						</View>
						<View style={{flexDirection: "row", flexWrap: "wrap"}}>
							<Chip
								title={`${getStr("thosDrafts")} ${counts?.drafts ?? "—"}`}
								onPress={() => showTasks("drafts")}
								selected={tab === "drafts"}
								style={{flex: 1, minWidth: 90, alignItems: "center"}}
							/>
							<Chip
								title={`${getStr("thosUnread")} ${counts?.unread ?? "—"}`}
								onPress={() => showTasks("unread")}
								selected={tab === "unread"}
								style={{flex: 1, minWidth: 90, alignItems: "center"}}
							/>
							<Chip
								title={getStr("thosPhases")}
								onPress={() => showTasks("phases")}
								selected={tab === "phases"}
								style={{flex: 1, minWidth: 90, alignItems: "center"}}
							/>
						</View>
						{error && (
							<Text
								testID="thos-error"
								style={{color: colors.statusError, padding: 12}}>
								{error}
							</Text>
						)}
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								justifyContent: "space-between",
								marginTop: 12,
							}}>
							<Chip
								title={`${getStr("thosFavorites")} ${favorites.length}`}
								style={{flex: 1, alignItems: "center"}}
								selected={tab === "services" && onlyFavorites}
								onPress={() => showServices(true)}
							/>
							<Chip
								title={getStr("thosAllServices")}
								style={{flex: 1, alignItems: "center"}}
								selected={tab === "services" && !onlyFavorites}
								onPress={() => showServices(false)}
							/>
						</View>
						<TextInput
							testID="thos-search"
							accessibilityLabel={getStr("thosSearchAccessibility")}
							value={query}
							onChangeText={setQuery}
							placeholder={
								tab === "services"
									? onlyFavorites
										? getStr("thosSearchFavorites")
										: getStr("thosSearchServices")
									: getStr("thosSearchTasks")
							}
							placeholderTextColor={colors.fontB2}
							returnKeyType="search"
							submitBehavior="blurAndSubmit"
							style={{
								color: colors.text,
								borderColor: colors.inputBorder,
								borderWidth: 1,
								borderRadius: 12,
								padding: 12,
								marginVertical: 12,
							}}
						/>
						{!(tab === "services" && onlyFavorites) && !complete && (
							<Text style={{color: colors.fontB2, marginBottom: 8}}>
								{!page ? getStr("thosReading") : getStr("thosPartialResults")}
							</Text>
						)}
						<View style={{flexDirection: "row", flexWrap: "wrap", gap: 12}}>
							{tab === "services"
								? serviceRows.map((item) => (
										<View
											key={item.id}
											style={{
												width:
													width >= 900 ? "31%" : width >= 600 ? "47%" : "100%",
												borderRadius: 12,
												padding: 16,
												backgroundColor: colors.contentBackground,
											}}>
											<View
												style={{flexDirection: "row", alignItems: "flex-start"}}>
												<TouchableOpacity
													onPress={() =>
														navigation.navigate("ThosServiceDetail", {
															service: item,
															accountId: userId,
														})
													}
													accessibilityRole="button"
													style={{flex: 1}}>
													<Text
														style={{
															color: colors.text,
															fontSize: 17,
															fontWeight: "600",
														}}>
														{item.name}
													</Text>
												</TouchableOpacity>
												<TouchableOpacity
													testID={`thos-favorite-${item.id}`}
													accessibilityRole="button"
													accessibilityLabel={
														favorites.includes(item.id)
															? getStr("thosCancelFavorite")
															: getStr("thosFavoriteService")
													}
													onPress={() => favorite(item.id)}
													style={{padding: 4, marginLeft: 8}}>
													{favorites.includes(item.id) ? (
														<IconStarActive width={24} height={24} />
													) : (
														<IconStar width={24} height={24} />
													)}
												</TouchableOpacity>
											</View>
											<Text style={{color: colors.fontB2, marginVertical: 10}}>
												{item.department || getStr("thosDepartmentUnavailable")}
											</Text>
										</View>
									))
								: taskRows.map((item) => (
										<TouchableOpacity
											key={`${item.kind}:${item.key}`}
											onPress={() =>
												navigation.navigate("ThosTaskDetail", {
													task: item,
													accountId: userId,
												})
											}
											style={{
												width: "100%",
												padding: 16,
												borderRadius: 12,
												backgroundColor: colors.contentBackground,
											}}>
											<Text
												style={{
													color: colors.text,
													fontSize: 17,
													fontWeight: "600",
												}}>
												{item.title}
											</Text>
											<Text style={{color: colors.mainTheme, marginVertical: 8}}>
												{getThosTaskStatusLabel(item.status)}
												{item.workflowStatus
													? ` · ${getThosTaskStatusLabel(item.workflowStatus)}`
													: ""}
												{item.node ? ` · ${item.node}` : ""}
											</Text>
											{!!item.summary && (
												<Text style={{color: colors.fontB2, marginBottom: 6}}>
													{getStr("thosSummary")}
													{item.summary}
												</Text>
											)}
											{item.progress !== undefined && (
												<>
													<View
														accessibilityLabel={getStr("thosProgress").replace(
															"{0}",
															String(item.progress),
														)}
														style={{
															height: 5,
															borderRadius: 3,
															backgroundColor: colors.themeGrey,
														}}>
														<View
															style={{
																height: 5,
																width: `${item.progress}%`,
																backgroundColor: colors.mainTheme,
																borderRadius: 3,
															}}
														/>
													</View>
													<Text style={{color: colors.fontB2, marginTop: 6}}>
														{item.progress}%
													</Text>
												</>
											)}
											{!!item.date && (
												<Text style={{color: colors.fontB2, marginTop: 6}}>
													{item.kind === "completed"
														? getStr("thosCompletionTime")
														: item.kind === "drafts"
															? getStr("thosLastModifiedTime")
															: getStr("thosApplicationTime")}
													{getStr("colonMark")}
													{item.date}
												</Text>
											)}
										</TouchableOpacity>
									))}
						</View>
						{page &&
							(tab === "services" ? serviceRows : taskRows).length === 0 && (
								<Text style={{padding: 20, color: colors.fontB2}}>
									{tab === "services" && onlyFavorites && !query && complete
										? getStr("thosNoFavorites")
										: query
											? getStr("thosNoMatch")
											: complete
												? getStr("thosNoTasks")
												: getStr("thosNoResults")}
								</Text>
							)}
						{updated && (
							<Text style={{color: colors.fontB2, marginTop: 12}}>
								{getStr("thosRefreshTime")}
								{new Date(updated).toLocaleTimeString()}
							</Text>
						)}
					</>
				)}
			</ScrollView>
		</KeyboardAvoidingScreen>
	);
};

export const THOS_BACK_SCRIPT = `(function(){if(window.__thuInfoThosBackStarted)return;window.__thuInfoThosBackStarted=true;
document.addEventListener('click',function(event){var target=event.target;
var button=target&&target.closest?target.closest('#head_back'):null;
if(!button||!window.ReactNativeWebView||!window.ReactNativeWebView.postMessage)return;
event.preventDefault();event.stopImmediatePropagation();
window.ReactNativeWebView.postMessage(JSON.stringify({type:'thos-back'}));
},true);})();true;`;

export const ThosPortalScreen = ({
	route,
	navigation,
}: {
	route: {params: {url: string}};
	navigation: RootNav;
}) => {
	const {colors} = themes(useColorScheme());
	const userId = useSelector((s: State) => s.auth.userId);
	const browser = useRef<WebView<object>>(null);
	const generation = useRef(0);
	const backing = useRef(false);
	const [source, setSource] = useState<string>();
	const [epoch, setEpoch] = useState(0);
	const [busy, setBusy] = useState(true);
	const [error, setError] = useState<string>();
	const [canBack, setCanBack] = useState(false);
	const [current, setCurrent] = useState("");
	const prepare = useCallback(async () => {
		const token = ++generation.current;
		setBusy(true);
		setError(undefined);
		setSource(undefined);
		setCanBack(false);
		try {
			if (!userId || helper.mocked()) throw new Error("no live account");
			await helper.prepareThosSession();
			if (Platform.OS === "android") {
				// Same Android CookieManager used by RN networking and WebView; never manufacture a Cookie header.
				const cookies =
					require("@preeternal/react-native-cookie-manager").default;
				if (cookies?.flush) await cookies.flush();
			}
			if (token !== generation.current) return;
			setSource(routeThosUrl(route.params.url));
			setEpoch((value) => value + 1);
		} catch {
			if (token === generation.current) {
				setBusy(false);
				setError(getStr("thosConnectionError"));
			}
		}
	}, [route.params.url, userId]);
	useEffect(() => {
		const requestGeneration = generation;
		prepare();
		return () => {
			requestGeneration.current++;
		};
	}, [prepare]);
	useEffect(() => {
		if (!navigation.setOptions) return;
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					testID="thos-portal-refresh"
					accessibilityRole="button"
					accessibilityLabel={getStr("thosRefresh")}
					disabled={busy}
					onPress={prepare}
					style={{
						paddingHorizontal: 16,
						marginHorizontal: 4,
						opacity: busy ? 0.5 : 1,
					}}>
					<IconRefreshNavBar width={24} height={24} />
				</TouchableOpacity>
			),
		});
	}, [busy, navigation, prepare]);
	useEffect(() => {
		const listener = BackHandler.addEventListener("hardwareBackPress", () => {
			if (canBack) {
				browser.current?.goBack();
				return true;
			}
			return false;
		});
		return () => listener.remove();
	}, [canBack]);
	const fail = (message: string) => {
		setBusy(false);
		setError(message);
	};
	const external = (url: string) => {
		if (!/^https?:\/\//i.test(url) && !/^(tel:|mailto:)/i.test(url)) {
			fail(getStr("thosUnsupportedLink"));
			return;
		}
		Alert.alert(getStr("thosExternalLink"), getStr("thosExternalLinkMessage"), [
			{text: getStr("cancel"), style: "cancel"},
			{
				text: getStr("thosOpen"),
				onPress: () => {
					Linking.openURL(url).catch(() => fail(getStr("thosNoLinkApp")));
				},
			},
		]);
	};
	const navigate = (url: string) => {
		if (url === "about:blank") return true;
		if (isThosAuthUrl(url)) {
			fail(getStr("thosSessionRefresh"));
			return false;
		}
		if (!isThosUniversityUrl(url)) {
			external(url);
			return false;
		}
		const target = routeThosUrl(url);
		if (target !== url) {
			setSource(target);
			return false;
		}
		return true;
	};
	const handleMessage = (event: WebViewMessageEvent) => {
		if (
			!isThosUniversityUrl(event.nativeEvent.url) ||
			isThosAuthUrl(event.nativeEvent.url)
		)
			return;
		try {
			const result = JSON.parse(event.nativeEvent.data);
			if (result.type === "thos-back") {
				if (backing.current) return;
				backing.current = true;
				if (canBack && browser.current) browser.current.goBack();
				else navigation.goBack();
				setTimeout(() => {
					backing.current = false;
				}, 500);
				return;
			}
		} catch {
			/* Non-JSON messages cannot invoke native actions. */
		}
	};
	return (
		<View
			style={{flex: 1, backgroundColor: colors.themeBackground}}
			testID="thos-portal">
			{busy && (
				<View style={{padding: 12, flexDirection: "row", gap: 12}}>
					<ActivityIndicator color={colors.mainTheme} />
					<Text style={{color: colors.text}}>
						{source
							? getStr("thosPortalLoading")
							: getStr("thosSessionLoading")}
					</Text>
				</View>
			)}
			{error && (
				<View style={{padding: 16}}>
					<Text testID="thos-portal-error" style={{color: colors.statusError}}>
						{error}
					</Text>
				</View>
			)}
			{source && (
				<WebView<object>
					testID="thos-webview"
					key={epoch}
					ref={browser}
					style={{flex: 1}}
					source={{uri: source}}
					userAgent={USER_AGENT}
					javaScriptEnabled
					domStorageEnabled
					sharedCookiesEnabled
					thirdPartyCookiesEnabled
					mixedContentMode="never"
					allowFileAccess={false}
					setSupportMultipleWindows
					originWhitelist={["*"]}
					onShouldStartLoadWithRequest={(request) => navigate(request.url)}
					onOpenWindow={({nativeEvent}) => {
						if (
							nativeEvent.targetUrl !== "about:blank" &&
							navigate(nativeEvent.targetUrl)
						)
							setSource(routeThosUrl(nativeEvent.targetUrl));
					}}
					onNavigationStateChange={(state) => {
						setCanBack(state.canGoBack);
						setCurrent(state.url);
					}}
					onLoadStart={() => {
						setBusy(true);
						setError(undefined);
					}}
					injectedJavaScriptBeforeContentLoaded={THOS_BACK_SCRIPT}
					onLoadEnd={() => {
						setBusy(false);
					}}
					onMessage={handleMessage}
					onError={() => fail(getStr("thosPortalLoadFailed"))}
					onHttpError={({nativeEvent}) => {
						if (nativeEvent.url === current || nativeEvent.url === source)
							fail(
								getStr("thosHttpError").replace(
									"{0}",
									String(nativeEvent.statusCode),
								),
							);
					}}
					onRenderProcessGone={() => fail(getStr("thosRenderProcessGone"))}
					onContentProcessDidTerminate={() =>
						fail(getStr("thosContentProcessGone"))
					}
				/>
			)}
		</View>
	);
};
