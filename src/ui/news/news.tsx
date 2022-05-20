import {
	Text,
	View,
	RefreshControl,
	ActivityIndicator,
	Dimensions,
	ScrollView,
	TextInput,
} from "react-native";
import React, {useState, useEffect} from "react";
import {FlatList, TouchableOpacity} from "react-native-gesture-handler";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {helper} from "../../redux/store";
import {RootNav} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {
	NewsSlice,
	SourceTag,
	sourceTags,
} from "thu-info-lib/dist/models/news/news";
import {useColorScheme} from "react-native";
import themedStyles from "../../utils/themedStyles";
import {SettingsLargeButton} from "../../components/settings/items";

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
			style={{alignItems: "center", marginHorizontal: 6}}
			onPress={onPress}
			disabled={selected}>
			<Text
				style={{
					fontSize: 15,
					color: selected ? colors.primaryLight : colors.text,
				}}>
				{getStr(channel ?? "all")}
			</Text>
			<View
				style={{
					height: 2,
					width: 12,
					borderRadius: 1,
					margin: 2,
					backgroundColor: selected ? colors.primaryLight : undefined,
				}}
			/>
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
	const [channel, setChannel] = useState<SourceTag | undefined>();
	const [fetchedAll, setFetchedAll] = useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

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
			? helper.searchNewsList(request ? 1 : page + 1, searchKey, channel)
			: helper.getNewsList(request ? 1 : page + 1, 30, channel)
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
	useEffect(fetchNewsList, [channel]);

	let screenHeight = Dimensions.get("window");
	const flatListRef = React.useRef(null);

	return (
		<View style={{marginHorizontal: 12}}>
			<ScrollView style={{margin: 6}} horizontal={true}>
				<ChannelTag
					channel={undefined}
					selected={channel === undefined}
					onPress={() => setChannel(undefined)}
				/>
				{sourceTags.map((tag) => (
					<ChannelTag
						key={tag}
						channel={tag}
						selected={channel === tag}
						onPress={() => setChannel(tag)}
					/>
				))}
			</ScrollView>
			<FlatList
				ref={flatListRef}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={fetchNewsList}
						colors={[theme.colors.accent]}
					/>
				}
				ListHeaderComponent={
					<View style={{flexDirection: "row"}}>
						<TextInput
							value={searchKey}
							onChangeText={setSearchKey}
							style={{
								flex: 3,
								marginLeft: 12,
								textAlignVertical: "center",
								fontSize: 15,
								paddingHorizontal: 12,
								backgroundColor: theme.colors.background,
								color: theme.colors.text,
								borderColor: "#CCC",
								borderWidth: 1,
								borderRadius: 5,
							}}
							placeholder={getStr("searchNewsPrompt")}
						/>
						<SettingsLargeButton
							text={getStr("search")}
							onPress={() => {
								fetchNewsList(true, searchKey !== "");
							}}
							disabled={refreshing || loading}
							redText={false}
						/>
					</View>
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
					<View style={style.newsSliceContainer}>
						<TouchableOpacity
							onPress={() => navigation.navigate("NewsDetail", {detail: item})}>
							<Text
								numberOfLines={2}
								style={{
									fontSize: 16,
									fontWeight: "bold",
									margin: 5,
									lineHeight: 20,
									color: theme.colors.text,
								}}>
								{item.name.trim()}
							</Text>
							<View
								style={{margin: 5, flexDirection: "row", alignItems: "center"}}>
								{item.source.length > 0 && (
									<>
										<Text
											style={{fontWeight: "bold", color: theme.colors.text}}>
											{item.source}
										</Text>
										<View
											style={{
												marginHorizontal: 6,
												height: 12,
												width: 4,
												borderRadius: 2,
												backgroundColor: theme.colors.accent,
											}}
										/>
									</>
								)}
								<Text style={{fontWeight: "bold", color: theme.colors.text}}>
									{getStr(item.channel)}
								</Text>
							</View>
							<Text style={{color: "gray", margin: 5}}>
								{item.date}
								{item.topped && (
									<Text style={{color: "red"}}>
										{"   "}
										{getStr("topped")}
									</Text>
								)}
							</Text>
						</TouchableOpacity>
					</View>
				)}
				onEndReached={() => fetchNewsList(false)}
				onEndReachedThreshold={0.6}
				ListFooterComponent={
					loading && newsList.length !== 0 ? (
						<View style={style.footerContainer}>
							<ActivityIndicator size="small" />
							<Text style={{margin: 10, color: theme.colors.text}}>
								{getStr("loading")}
							</Text>
						</View>
					) : null
				}
			/>
		</View>
	);
};

const styles = themedStyles(({colors}) => ({
	newsSliceContainer: {
		backgroundColor: colors.background,
		justifyContent: "center",
		padding: 6,
		marginVertical: 6,
		shadowColor: "grey",
		shadowOffset: {
			width: 2,
			height: 2,
		},
		shadowOpacity: 0.8,
		shadowRadius: 2,
		borderRadius: 5,
		elevation: 2,
	},

	footerContainer: {
		flexDirection: "row",
		alignSelf: "stretch",
		height: 80,
		justifyContent: "center",
		alignItems: "center",
	},
}));
