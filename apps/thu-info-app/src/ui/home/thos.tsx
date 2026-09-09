import React, {useCallback, useEffect, useRef, useState} from "react";
import {
	ActivityIndicator,
	Alert,
	BackHandler,
	Linking,
	Platform,
	RefreshControl,
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

const labels: Record<ThosTaskKind, string> = {
	active: "在办事务",
	todo: "待我处理",
	completed: "已办结",
};
type TaskPages = Partial<Record<ThosTaskKind, ThosPage<ThosTask>>>;
const genericError = "连接在线服务失败，请重试。认证由 THU Info 内置登录完成。";
const emptyMessage = "读取中";
const blankPageMessage =
	"页面长时间没有显示内容。请点击右上角刷新，或返回事务列表；不会重放已提交的表单。";
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
					backgroundColor: selected ? colors.mainTheme : colors.contentBackground,
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
							accessibilityLabel="进入在线服务网站"
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
			for (const kind of ["todo", "active", "completed"] as ThosTaskKind[]) {
				if (!alive()) return;
				try {
					const page = await helper.getThosTasks(kind);
					if (!alive()) return;
					setTasks((previous) => ({...previous, [kind]: page}));
				} catch {
					warnings.push(`${labels[kind]}读取失败，可打开官方列表查看`);
				}
			}
			if (!alive()) return;
			try {
				const page = await helper.getThosServices();
				if (alive()) setServices(page);
			} catch {
				warnings.push("服务目录读取失败，可打开官方目录查看");
			}
			if (alive()) {
				setUpdated(Date.now());
				setError(warnings.length ? warnings.join("\n") : undefined);
			}
		} catch {
			if (alive()) setError(genericError);
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
	const open = useCallback((url: string) => {
		if (!demo && url)
			navigation.navigate("ThosPortal", {url: routeThosUrl(url)});
	}, [demo, navigation]);
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
		).catch(() => setError("收藏保存失败，请重试"));
	};
	const showServices = (quick: boolean) => {
		setTab("services");
		setOnlyFavorites(quick && favorites.length > 0);
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
		`${x.title} ${x.node} ${x.id}`.toLowerCase().includes(query.toLowerCase()),
	);
	const serviceRows = (services?.items ?? []).filter(
		(x) =>
			(!onlyFavorites || favorites.includes(x.id)) &&
			`${x.name} ${x.department}`.toLowerCase().includes(query.toLowerCase()),
	);
	const page = tab === "services" ? services : tasks[tab];
	const complete = page?.complete && (tab !== "todo" || tasks.active?.complete);
	return (
		<ScrollView
			testID="thos-dashboard"
			style={{flex: 1, backgroundColor: colors.themeBackground}}
			onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
			keyboardShouldPersistTaps="handled"
			refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}
			contentContainerStyle={{
				padding: 16,
				paddingBottom: 40,
				maxWidth: 1100,
				width: "100%",
				alignSelf: "center",
			}}>
			{demo && (
				<Text style={{color: colors.statusWarning, marginVertical: 8}}>
					演示账号 · 虚构数据，官方页面入口已禁用
				</Text>
			)}
			{!userId ? (
				<Chip title="使用 THU Info 账号登录" onPress={login} />
			) : (
				<>
					<View
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							marginVertical: 10,
						}}>
						{(["active", "todo", "completed"] as ThosTaskKind[]).map((kind) => (
							<TouchableOpacity
								key={kind}
								onPress={() => {
									setTab(kind);
									setOnlyFavorites(false);
									setQuery("");
								}}
								style={{
									flex: 1,
									minWidth: 90,
									padding: 14,
									margin: 4,
									borderRadius: 12,
									alignItems: "center",
									backgroundColor:
										tab === kind
											? colors.mainTheme
											: colors.contentBackground,
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
									{labels[kind]}
								</Text>
							</TouchableOpacity>
						))}
					</View>
					<View style={{flexDirection: "row", flexWrap: "wrap"}}>
						<Chip
							title={`草稿 ${counts?.drafts ?? "—"}`}
							onPress={() => open(THOS_BASE + thosPages.drafts)}
							disabled={demo}
							style={{flex: 1, minWidth: 90, alignItems: "center"}}
						/>
						<Chip
							title={`待阅 ${counts?.unread ?? "—"}`}
							onPress={() => open(THOS_BASE + thosPages.unread)}
							disabled={demo}
							style={{flex: 1, minWidth: 90, alignItems: "center"}}
						/>
						<Chip
							title="阶段性事项"
							onPress={() => open(THOS_BASE + thosPages.phases)}
							disabled={demo}
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
							title={`收藏服务 ${favorites.length}`}
							style={{flex: 1, alignItems: "center"}}
							selected={tab === "services" && onlyFavorites}
							onPress={() => showServices(true)}
						/>
						<Chip
							title="全部服务"
							style={{flex: 1, alignItems: "center"}}
							selected={tab === "services" && !onlyFavorites}
							onPress={() => showServices(false)}
						/>
					</View>
					<TextInput
						testID="thos-search"
						accessibilityLabel="搜索在线服务"
						value={query}
						onChangeText={setQuery}
						placeholder={
							tab === "services"
								? onlyFavorites
									? "搜索收藏服务"
									: "搜索服务或部门，如入校、场地"
								: "搜索事务、编号或节点"
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
							{!page
								? emptyMessage
								: "当前为部分结果，请对照官方列表"}
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
						<View style={{flexDirection: "row", alignItems: "flex-start"}}>
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
									favorites.includes(item.id) ? "取消收藏" : "收藏服务"
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
							{item.department || "部门未提供"}
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
											{item.status}
											{item.node ? ` · ${item.node}` : ""}
										</Text>
										{item.progress !== undefined && (
											<>
												<View
													accessibilityLabel={`进度 ${item.progress}%`}
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
												{item.kind === "completed" ? "办结时间" : "申请时间"}：
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
									? "还没有收藏服务，去全部服务收藏常用事项。"
									: query
										? "没有匹配结果"
										: complete
											? "当前没有此类事项"
											: "当前尚无结果，请打开官方页面核对"}
							</Text>
						)}
					{updated && (
						<Text style={{color: colors.fontB2, marginTop: 12}}>
							刷新时间：{new Date(updated).toLocaleTimeString()}
						</Text>
					)}
				</>
			)}
		</ScrollView>
	);
};

// Only reports rendering health; no cookies, form fields or personal page text cross this message boundary.
export const THOS_HEALTH_SCRIPT = `(function(){if(window.__thuInfoThosHealthStarted)return;window.__thuInfoThosHealthStarted=true;
var tries=0;function check(){var b=document.body;
var visible=!!b&&((b.innerText||'').trim().length>20||!!b.querySelector('iframe,form,input,canvas'));
window.ReactNativeWebView.postMessage(JSON.stringify({type:'thos-render-health',visible:visible}));
if(!visible&&++tries<60)setTimeout(check,1000);}setTimeout(check,500);})();true;`;
export const THOS_BACK_SCRIPT = `(function(){if(window.__thuInfoThosBackStarted)return;window.__thuInfoThosBackStarted=true;
document.addEventListener('click',function(event){var target=event.target;
var button=target&&target.closest?target.closest('#head_back'):null;
if(!button||!window.ReactNativeWebView||!window.ReactNativeWebView.postMessage)return;
event.preventDefault();event.stopImmediatePropagation();
window.ReactNativeWebView.postMessage(JSON.stringify({type:'thos-back'}));
},true);})();true;`;
export const THOS_INJECTED_SCRIPT = `${THOS_HEALTH_SCRIPT}\n${THOS_BACK_SCRIPT}`;

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
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const backing = useRef(false);
	const [source, setSource] = useState<string>();
	const [epoch, setEpoch] = useState(0);
	const [busy, setBusy] = useState(true);
	const [error, setError] = useState<string>();
	const [canBack, setCanBack] = useState(false);
	const [current, setCurrent] = useState("");
	const clearTimer = () => {
		if (timer.current) clearTimeout(timer.current);
	};
	const prepare = useCallback(async () => {
		const token = ++generation.current;
		clearTimer();
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
				setError(genericError);
			}
		}
	}, [route.params.url, userId]);
	useEffect(() => {
		const requestGeneration = generation;
		prepare();
		return () => {
			requestGeneration.current++;
			clearTimer();
		};
	}, [prepare]);
	useEffect(() => {
		if (!navigation.setOptions) return;
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					testID="thos-portal-refresh"
					accessibilityRole="button"
					accessibilityLabel="刷新"
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
		clearTimer();
		setBusy(false);
		setError(message);
	};
	const external = (url: string) => {
		if (!/^https?:\/\//i.test(url) && !/^(tel:|mailto:)/i.test(url)) {
			fail("此链接类型暂不支持");
			return;
		}
		Alert.alert("打开外部链接", "将在系统浏览器或其他应用中继续。", [
			{text: "取消", style: "cancel"},
			{
				text: "打开",
				onPress: () => {
					Linking.openURL(url).catch(() => fail("没有可打开此链接的应用"));
				},
			},
		]);
	};
	const navigate = (url: string) => {
		if (url === "about:blank") return true;
		if (isThosAuthUrl(url)) {
			fail(
				"THOS 会话需要更新，请点右上角刷新，使用内置认证继续。",
			);
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
		// Official services can redirect within the university; rendering health is not proof of authentication.
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
			if (result.type === "thos-render-health" && result.visible === true) {
				clearTimer();
				setBusy(false);
				setError((previous) =>
					previous === blankPageMessage ? undefined : previous,
				);
			}
		} catch {
			/* Non-health messages cannot invoke native actions. */
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
						{source ? "正在载入…" : "正在复用 THU Info 登录会话…"}
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
						clearTimer();
						setBusy(true);
						setError(undefined);
						timer.current = setTimeout(() => fail(blankPageMessage), 25_000);
					}}
					injectedJavaScriptBeforeContentLoaded={THOS_INJECTED_SCRIPT}
					onLoadProgress={({nativeEvent}) => {
						if (nativeEvent.progress >= 0.5)
							browser.current?.injectJavaScript(THOS_INJECTED_SCRIPT);
					}}
					onLoadEnd={() => {
						browser.current?.injectJavaScript(THOS_INJECTED_SCRIPT);
					}}
					onMessage={handleMessage}
					onError={() =>
						fail(
							"官方页面加载失败，请点右上角刷新。若正处理表单，请先在事务列表核对状态。",
						)
					}
					onHttpError={({nativeEvent}) => {
						if (nativeEvent.url === current || nativeEvent.url === source)
							fail(`系统页面暂时不可用（HTTP ${nativeEvent.statusCode}）`);
					}}
					onRenderProcessGone={() =>
						fail("网页进程已退出，请点击右上角刷新。未提交的表单可能需要重新填写。")
					}
					onContentProcessDidTerminate={() =>
						fail("网页进程已退出，请点击右上角刷新。")
					}
				/>
			)}
		</View>
	);
};
