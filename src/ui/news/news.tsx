import {
	Text,
	View,
	RefreshControl,
	Dimensions,
	ScrollView,
	TextInput,
	FlatList,
	TouchableOpacity,
	Platform,
} from "react-native";
import React, {useState, useEffect} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {helper} from "../../redux/store";
import {RootNav} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {
	NewsSlice,
	ChannelTag,
	NewsSubscription,
} from "thu-info-lib/dist/models/news/news";
import {useColorScheme} from "react-native";
import IconSearch from "../../assets/icons/IconSearch";
import IconSubscriptionLogo from "../../assets/icons/IconSubscriptionLogo";
import {NewsListItem} from "../../components/news/NewsListItem";
import {IconStarButton} from "../../components/news/IconStarButton";
import {useSelector} from "react-redux";
import IconSubscription from "../../assets/icons/IconSubscription";

type Category =
	| "catSubscribed"
	| "catPublicInformation"
	| "catStudyAndResearch"
	| "catStudentAffairs"
	| "catCampusLife"
	| "catEmploymentInformation";

const categoryChannelGroups: {category: Category; channels: ChannelTag[]}[] = [
	{
		category: "catPublicInformation",
		channels: ["LM_ZYGG", "LM_YQFKZT", "LM_BGTG", "LM_HB"],
	},
	{
		category: "catStudyAndResearch",
		channels: ["LM_JWGG", "LM_TTGGG", "LM_KYTZ"],
	},
	{category: "catStudentAffairs", channels: ["LM_XSBGGG", "LM_XJ_XTWBGTZ"]},
	{category: "catCampusLife", channels: ["LM_JYGG", "LM_XJ_XSSQDT"]},
	{
		category: "catEmploymentInformation",
		channels: ["LM_BYJYXX", "LM_JYZPXX", "LM_XJ_GJZZSXRZ"],
	},
];

const CategoryTagButton = ({
	category,
	selected,
	onPress,
}: {
	category: Category | undefined;
	selected: boolean;
	onPress: () => void;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<TouchableOpacity
			style={{alignItems: "center", marginVertical: 12, marginHorizontal: 8}}
			onPress={onPress}
			disabled={selected}>
			<Text
				style={{
					fontSize: 16,
					fontWeight: selected ? "600" : "400",
					color: selected ? colors.text : colors.fontB2,
				}}>
				{getStr(category ?? "all")}
			</Text>
			<View
				style={{
					height: 2,
					width: 24,
					borderRadius: 1,
					marginVertical: 2,
					backgroundColor: selected ? colors.themePurple : undefined,
				}}
			/>
		</TouchableOpacity>
	);
};

const makeSubscriptionText = (n: NewsSubscription) => {
	if (n.id === "0") {
		return getStr("all");
	} else if (!n.source) {
		return n.channel;
	} else if (!n.channel) {
		return n.source;
	} else {
		return `${n.source} | ${n.channel}`;
	}
};

const ChannelTagButton = ({
	channel,
	selected,
	onPress,
	isSubscription,
}: {
	channel: ChannelTag | NewsSubscription | undefined;
	selected: boolean;
	onPress: () => void;
	isSubscription: boolean;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<TouchableOpacity
			style={{
				alignItems: "center",
				marginVertical: 4,
				marginHorizontal: 2,
				borderRadius: 20,
				borderWidth: 1,
				borderColor: selected ? colors.themePurple : colors.themeGrey,
				paddingHorizontal: 8,
				paddingVertical: 2,
			}}
			onPress={onPress}
			disabled={selected}>
			{isSubscription ? (
				<Text
					style={{
						fontSize: 14,
						color: selected ? colors.themePurple : colors.fontB2,
					}}>
					{makeSubscriptionText(channel as NewsSubscription)}
				</Text>
			) : (
				<Text
					style={{
						fontSize: 14,
						color: selected ? colors.themePurple : colors.fontB2,
					}}>
					{getStr((channel as ChannelTag | undefined) ?? "all")}
				</Text>
			)}
		</TouchableOpacity>
	);
};

type NewsSubscriptionId = string;

export const NewsScreen = ({navigation}: {navigation: RootNav}) => {
	const [newsList, setNewsList] = useState<NewsSlice[]>([]);
	const [refreshing, setRefreshing] = useState(true);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [inSearchMode, setInSearchMode] = useState(false);
	const [searchKey, setSearchKey] = useState("");
	const [categorySelected, setCategorySelected] = useState<
		Category | undefined
	>();
	const [channelSelected, setChannelSelected] = useState<
		ChannelTag | undefined | NewsSubscriptionId
	>(); // channelSelected can be used to specify which subscription is selected.
	const [fetchedAll, setFetchedAll] = useState(false);
	const [subscriptions, setSubscriptions] = useState<NewsSubscription[]>(
		[
			{
				id: "0",
				title: getStr("all"),
				order: -1,
			},
		], // The initial NewsSubscription means using ALL subscription rules.
	);

	const themeName = useColorScheme();
	const theme = themes(themeName);

	// @ts-ignore
	const dark = useSelector((s) => s.config.darkMode);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const darkModeHook = dark || themeName === "dark";

	const fetchNewsList = (
		request: boolean = true,
		searchMode: boolean | undefined = undefined,
	) => {
		setRefreshing(true);
		setLoading(true);

		// for news subscription
		if (categorySelected === "catSubscribed") {
			if (request) {
				setNewsList([]);
				setPage(1);
				setFetchedAll(false);
			} else {
				if (fetchedAll) {
					setRefreshing(false);
					setLoading(false);
					return;
				}
				setPage((p) => p + 1);
			}
			helper
				.getNewsListBySubscription(
					request ? 1 : page + 1,
					channelSelected === "0" ? undefined : channelSelected,
				)
				.then((res) => {
					if (res.length === 0) {
						setFetchedAll(true);
					} else {
						setNewsList((o) => o.concat(res));
					}
				})
				.catch(() => {
					Snackbar.show({
						text: getStr("networkRetry"),
						duration: Snackbar.LENGTH_LONG,
					});
				})
				.then(() => {
					setRefreshing(false);
					setLoading(false);
				});
			return;
		}

		if (request) {
			setNewsList([]);
			setPage(1);
			setFetchedAll(false);
			if (searchMode === undefined) {
				setInSearchMode(false);
				setSearchKey("");
			} else {
				setInSearchMode(searchMode);
			}
		} else {
			if (fetchedAll) {
				setRefreshing(false);
				setLoading(false);
				return;
			}
			setPage((p) => p + 1);
		}

		(searchMode === true ||
		(searchMode === undefined && !request && inSearchMode)
			? helper.searchNewsList(
					request ? 1 : page + 1,
					searchKey,
					channelSelected as ChannelTag,
					// eslint-disable-next-line no-mixed-spaces-and-tabs
			  )
			: helper.getNewsList(
					request ? 1 : page + 1,
					30,
					channelSelected as ChannelTag,
					// eslint-disable-next-line no-mixed-spaces-and-tabs
			  )
		)
			.then((res) => {
				if (res.length === 0) {
					setFetchedAll(true);
				} else {
					setNewsList((o) => o.concat(res));
				}
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_LONG,
				});
			})
			.then(() => {
				setRefreshing(false);
				setLoading(false);
			});
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(fetchNewsList, [channelSelected]);

	const [reload, setReload] = useState(1);
	const [inited, setInited] = useState(false);
	useEffect(() => {
		if (!inited) {
			setInited(true);
			return;
		}
		if (!__DEV__) {
			fetchNewsList();
		} // disable this line during debugging for better debugging experience
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reload]);

	useEffect(() => {
		if (categorySelected === undefined) {
			setChannelSelected(undefined);
		} else if (categorySelected === "catSubscribed") {
			setChannelSelected("0");
		} else {
			setChannelSelected(
				categoryChannelGroups.find(
					({category}) => category === categorySelected,
				)?.channels?.[0],
			);
		}
	}, [categorySelected]);

	let screenHeight = Dimensions.get("window");

	return (
		<View style={{flex: 1, marginTop: Platform.OS === "ios" ? 40 : 0}}>
			<View style={{flex: 0}}>
				<ScrollView
					showsHorizontalScrollIndicator={false}
					horizontal={true}
					style={{marginHorizontal: 8}}>
					<CategoryTagButton
						category={"catSubscribed"}
						selected={categorySelected === "catSubscribed"}
						onPress={() => {
							setCategorySelected("catSubscribed");
							helper
								.getNewsSubscriptionList()
								.then((res) => {
									if (subscriptions.length === 1) {
										setSubscriptions(subscriptions.concat(res));
									}
								})
								.catch(() => {
									Snackbar.show({
										text: getStr("networkRetry"),
										duration: Snackbar.LENGTH_LONG,
									});
								});
						}}
					/>
					<CategoryTagButton
						category={undefined}
						selected={categorySelected === undefined}
						onPress={() => setCategorySelected(undefined)}
					/>
					{categoryChannelGroups.map(({category}) => (
						<CategoryTagButton
							key={category}
							category={category}
							selected={categorySelected === category}
							onPress={() => setCategorySelected(category)}
						/>
					))}
				</ScrollView>
			</View>
			{(() => {
				if (categorySelected === undefined) {
					return (
						<View
							style={{
								flex: 0,
								flexDirection: "row",
								marginLeft: 28,
								marginTop: 4,
								marginRight: 12,
								alignItems: "center",
							}}>
							<TextInput
								value={searchKey}
								onChangeText={setSearchKey}
								style={{
									flex: 1,
									textAlignVertical: "center",
									fontSize: 14,
									paddingVertical: 4,
									paddingLeft: 39,
									backgroundColor: theme.colors.themeBackground,
									color: theme.colors.text,
									borderColor: theme.colors.themePurple,
									borderWidth: 1.5,
									borderRadius: 20,
								}}
								placeholder={getStr("searchNewsPrompt")}
								placeholderTextColor={theme.colors.fontB3}
								onEndEditing={() => {
									if (!refreshing && !loading) {
										fetchNewsList(true, searchKey !== "");
									}
								}}
							/>
							<View style={{position: "absolute", left: 12}}>
								<IconSearch height={18} width={18} />
							</View>
							<IconStarButton
								active={false}
								size={24}
								onPress={() => {
									navigation.navigate("NewsFav", {
										reloadFunc: () => setReload((i) => i + 1),
									});
								}}
							/>
						</View>
					);
				} else if (categorySelected === "catSubscribed") {
					if (subscriptions.length === 1) {
						return <></>;
					} else {
						return (
							<View
								style={{
									flex: 0,
									flexDirection: "row",
									marginTop: 4,
									marginHorizontal: 12,
									alignItems: "center",
								}}>
								<TouchableOpacity
									style={{marginRight: 8}}
									onPress={() => {
										navigation.navigate("NewsSub");
									}}>
									<IconSubscription width={18} height={18} />
								</TouchableOpacity>
								<ScrollView
									showsHorizontalScrollIndicator={false}
									horizontal={true}>
									{subscriptions.map((s) => (
										<ChannelTagButton
											key={s.id}
											channel={s}
											selected={channelSelected === s.id}
											onPress={() => setChannelSelected(s.id)}
											isSubscription={true}
										/>
									))}
								</ScrollView>
								<IconStarButton
									active={false}
									size={24}
									onPress={() => {
										navigation.navigate("NewsFav", {
											reloadFunc: () => setReload((i) => i + 1),
										});
									}}
								/>
							</View>
						);
					}
				} else {
					return (
						<View
							style={{
								flex: 0,
								flexDirection: "row",
								marginTop: 4,
								marginHorizontal: 12,
								alignItems: "center",
							}}>
							<ScrollView
								showsHorizontalScrollIndicator={false}
								horizontal={true}>
								{categoryChannelGroups
									.find(({category}) => category === categorySelected)
									?.channels.map((channel) => (
										<ChannelTagButton
											key={channel}
											channel={channel}
											onPress={() => setChannelSelected(channel)}
											selected={channelSelected === channel}
											isSubscription={false}
										/>
									))}
							</ScrollView>
							<IconStarButton
								active={false}
								size={24}
								onPress={() => {
									navigation.navigate("NewsFav", {
										reloadFunc: () => setReload((i) => i + 1),
									});
								}}
							/>
						</View>
					);
				}
			})()}
			<FlatList
				style={{flex: 1, margin: 12, marginBottom: 0}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={fetchNewsList}
						colors={[theme.colors.accent]}
					/>
				}
				ListEmptyComponent={
					categorySelected === "catSubscribed" ? (
						subscriptions.length === 1 ? (
							<View style={{alignItems: "center", marginTop: 100}}>
								<IconSubscriptionLogo width={128} height={128} />
								<TouchableOpacity
									style={{
										borderWidth: 2,
										borderColor: theme.colors.mainTheme,
										borderRadius: 8,
										marginTop: 40,
									}}
									onPress={() => Snackbar.show({text: "TODO"})} //TODO
								>
									<Text
										style={{
											fontSize: 32,
											textAlign: "center",
											textAlignVertical: "center",
											color: theme.colors.mainTheme,
											marginHorizontal: 40,
											marginVertical: 5,
										}}>
										{getStr("addSubscription")}
									</Text>
								</TouchableOpacity>
								<Text style={{marginTop: 6, fontWeight: "100", fontSize: 12}}>
									{getStr("subscriptionInstruction")}
								</Text>
							</View>
						) : (
							<View
								style={{
									margin: 15,
									height: screenHeight.height * 0.6,
									justifyContent: "center",
									alignItems: "center",
								}}>
								<Text
									style={{
										fontSize: 18,
										fontWeight: "bold",
										alignSelf: "center",
										margin: 5,
										color: theme.colors.text,
									}}>
									{getStr("waitForLoading")}
								</Text>
							</View> //TODO
						)
					) : (
						<View
							style={{
								margin: 15,
								height: screenHeight.height * 0.6,
								justifyContent: "center",
								alignItems: "center",
							}}>
							<Text
								style={{
									fontSize: 18,
									fontWeight: "bold",
									alignSelf: "center",
									margin: 5,
									color: theme.colors.text,
								}}>
								{getStr("waitForLoading")}
							</Text>
						</View>
					)
				}
				data={newsList}
				keyExtractor={(item) => item.url}
				renderItem={({item}) => (
					<NewsListItem item={item} theme={theme} navigation={navigation} />
				)}
				onEndReached={() => fetchNewsList(false)}
				onEndReachedThreshold={0.6}
			/>
		</View>
	);
};
