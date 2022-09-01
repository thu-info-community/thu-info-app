import {
	Text,
	View,
	RefreshControl,
	Dimensions,
	ScrollView,
	TextInput,
	FlatList,
	TouchableOpacity,
} from "react-native";
import React, {useState, useEffect} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {helper} from "../../redux/store";
import {RootNav} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {NewsSlice, SourceTag} from "thu-info-lib/dist/models/news/news";
import {useColorScheme} from "react-native";
import IconSearch from "../../assets/icons/IconSearch";
import IconStar from "../../assets/icons/IconStar";

type Category =
	| "catPublicInformation"
	| "catStudyAndResearch"
	| "catStudentAffairs"
	| "catCampusLife"
	| "catEmploymentInformation";

const categoryChannelGroups: {category: Category; channels: SourceTag[]}[] = [
	{
		category: "catPublicInformation",
		channels: ["LM_ZYGG", "LM_YQFKZT", "LM_BGTG", "LM_HB"],
	},
	{
		category: "catStudyAndResearch",
		channels: ["LM_JWGG", "LM_TTGGG", "LM_KYTZ"],
	},
	{category: "catStudentAffairs", channels: ["LM_XSBGGG", "LM_XJ_XTWBGTZ"]},
	{category: "catCampusLife", channels: ["LM_XJ_XSSQDT"]},
	{
		category: "catEmploymentInformation",
		channels: ["LM_JYGG", "LM_JYZPXX", "LM_XJ_GJZZSXRZ"],
	},
];

const CategoryTag = ({
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

const ChannelTag = ({
	channel,
	selected,
	onPress,
}: {
	channel: SourceTag | undefined;
	selected: boolean;
	onPress: () => void;
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
			<Text
				style={{
					fontSize: 14,
					color: selected ? colors.themePurple : colors.fontB2,
				}}>
				{getStr(channel ?? "all")}
			</Text>
		</TouchableOpacity>
	);
};

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
		SourceTag | undefined
	>();
	const [fetchedAll, setFetchedAll] = useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const fetchNewsList = (
		request: boolean = true,
		searchMode: boolean | undefined = undefined,
	) => {
		setRefreshing(true);
		setLoading(true);

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
					channelSelected,
					// eslint-disable-next-line no-mixed-spaces-and-tabs
			  )
			: helper.getNewsList(request ? 1 : page + 1, 30, channelSelected)
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

	useEffect(() => {
		if (categorySelected === undefined) {
			setChannelSelected(undefined);
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
		<View style={{flex: 1}}>
			<View style={{flex: 0}}>
				<ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
					<CategoryTag
						category={undefined}
						selected={categorySelected === undefined}
						onPress={() => setCategorySelected(undefined)}
					/>
					{categoryChannelGroups.map(({category}) => (
						<CategoryTag
							key={category}
							category={category}
							selected={categorySelected === category}
							onPress={() => setCategorySelected(category)}
						/>
					))}
				</ScrollView>
			</View>
			{categorySelected === undefined ? (
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
					<TouchableOpacity style={{marginLeft: 8}}>
						<IconStar height={18} width={18} />
					</TouchableOpacity>
				</View>
			) : (
				<View
					style={{
						flex: 0,
						flexDirection: "row",
						marginTop: 4,
						marginHorizontal: 12,
						alignItems: "center",
					}}>
					<ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
						{categoryChannelGroups
							.find(({category}) => category === categorySelected)
							?.channels.map((channel) => (
								<ChannelTag
									key={channel}
									channel={channel}
									onPress={() => setChannelSelected(channel)}
									selected={channelSelected === channel}
								/>
							))}
					</ScrollView>
					<TouchableOpacity style={{marginLeft: 8}}>
						<IconStar height={18} width={18} />
					</TouchableOpacity>
				</View>
			)}
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
				}
				data={newsList}
				keyExtractor={(item) => item.url}
				renderItem={({item}) => (
					<TouchableOpacity
						style={{
							backgroundColor: theme.colors.contentBackground,
							justifyContent: "center",
							paddingVertical: 12,
							paddingHorizontal: 16,
							marginVertical: 4,
							borderRadius: 8,
						}}
						onPress={() => navigation.navigate("NewsDetail", {detail: item})}>
						<Text
							numberOfLines={3}
							style={{
								fontSize: 16,
								fontWeight: "600",
								lineHeight: 20,
								color: theme.colors.fontB1,
							}}>
							{item.name.trim()}
						</Text>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginTop: 12,
							}}>
							{item.source.length > 0 && (
								<>
									<Text
										style={{
											fontWeight: "600",
											color: theme.colors.fontB2,
											fontSize: 12,
										}}>
										{item.source}
									</Text>
									<View
										style={{
											marginHorizontal: 6,
											height: 11,
											width: 3,
											borderRadius: 1.5,
											backgroundColor: theme.colors.accent,
										}}
									/>
								</>
							)}
							<Text
								style={{
									fontWeight: "600",
									color: theme.colors.fontB2,
									fontSize: 12,
								}}>
								{getStr(item.channel)}
							</Text>
							{item.topped && (
								<View
									style={{
										marginLeft: 8,
										borderColor: theme.colors.statusWarning,
										backgroundColor: theme.colors.statusWarningOpacity,
										borderWidth: 1,
										borderRadius: 20,
										paddingHorizontal: 8,
									}}>
									<Text>
										<Text
											style={{color: theme.colors.statusWarning, fontSize: 11}}>
											{getStr("topped")}
										</Text>
									</Text>
								</View>
							)}
							<View style={{flex: 1}} />
							<Text style={{color: theme.colors.fontB2}}>{item.date}</Text>
						</View>
					</TouchableOpacity>
				)}
				onEndReached={() => fetchNewsList(false)}
				onEndReachedThreshold={0.6}
			/>
		</View>
	);
};
