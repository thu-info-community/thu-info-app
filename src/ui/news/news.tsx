import {
	Text,
	View,
	RefreshControl,
	ActivityIndicator,
	Button,
	Alert,
	Dimensions,
} from "react-native";
import React, {useState, useEffect} from "react";
import {
	FlatList,
	TouchableOpacity,
	TouchableWithoutFeedback,
	TextInput,
} from "react-native-gesture-handler";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import {helper, State} from "../../redux/store";
import {addNewsCacheAction} from "../../redux/actions/cache";
import {NewsCache} from "../../redux/states/cache";
import {connect} from "react-redux";
import {NewsNav, NewsRouteProp} from "./newsStack";
import dayjs from "dayjs";
import themes from "../../assets/themes/themes";
import {NewsSlice} from "thu-info-lib/dist/models/news/news";
import {useColorScheme} from "react-native";
import themedStyles from "../../utils/themedStyles";

interface NewsUIProps {
	route: NewsRouteProp;
	navigation: NewsNav;
	cache: Map<string, string>;
	addCache: (payload: NewsCache) => void;
}

export const NewsUI = ({route, navigation, cache, addCache}: NewsUIProps) => {
	const [newsList, setNewsList] = useState<NewsSlice[]>([]);
	const [refreshing, setRefreshing] = useState(true);
	const [loading, setLoading] = useState(false);
	const [newsNumberOnOnePage, setNewsNumber] = useState("20");
	const [page, setPage] = useState(1);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	const fetchNewsList = (request: boolean = true) => {
		setRefreshing(true);
		setLoading(true);

		if (request) {
			setNewsList([]);
			setPage(1);
		} else {
			setPage((p) => p + 1);
		}

		helper
			.getNewsList(
				request ? 1 : page + 1,
				parseInt(newsNumberOnOnePage, 10),
				route.params?.source,
			)
			.then((res) => {
				res.forEach(({url, date}) => {
					if (cache.get(url) === undefined) {
						helper.getNewsDetail(url).then(([_, __, abstract]) => {
							addCache({
								url,
								timestamp: dayjs(date, "YYYY.MM.DD").toDate().valueOf(),
								abstract: abstract.slice(0, 50),
							});
						});
					}
				});
				setNewsList((o) => o.concat(res));
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

	const rerender = () => {
		let n = parseInt(newsNumberOnOnePage, 10);

		if (isNaN(n)) {
			Alert.alert(getStr("numberOfNewsNaN"));
		} else if (n < 10 || n > 100) {
			Alert.alert(getStr("numberOfNewsOutOfRange"));
		} else {
			fetchNewsList();
		}
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(fetchNewsList, []);

	let screenHeight = Dimensions.get("window");
	const flatListRef = React.useRef(null);

	return (
		<>
			<View style={style.headerContainer}>
				<View style={style.textInputContainer}>
					<Text style={{color: theme.colors.text}}>
						{getStr("newsNumberOnPage")}
					</Text>
					<TextInput
						style={style.textInputStyle}
						placeholder="20"
						onChangeText={(txt) => setNewsNumber(txt)}
					/>
				</View>
				<Button title={getStr("confirm")} onPress={rerender} />
				<Button
					title={getStr("backToTop")}
					onPress={() =>
						// @ts-ignore
						flatListRef?.current?.scrollToOffset({animated: true, offset: 0})
					}
				/>
			</View>
			<FlatList
				ref={flatListRef}
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
						<Text
							style={{
								fontSize: 16,
								alignSelf: "center",
								color: "gray",
								margin: 5,
							}}>
							{getStr("newsTip")}
						</Text>
					</View>
				}
				data={newsList}
				keyExtractor={(item) => "" + newsList.indexOf(item)}
				renderItem={({item}) => (
					<View style={style.newsSliceContainer}>
						<View style={style.titleContainer}>
							<TouchableWithoutFeedback
								onPress={() => {
									if (route.params === undefined) {
										navigation.push("News", {source: item.channel});
									}
								}}>
								{<FontAwesome name="file-text-o" size={40} color="purple" />}
							</TouchableWithoutFeedback>
							<View>
								<Text
									style={{
										fontSize: 18,
										marginVertical: 2.5,
										marginHorizontal: 10,
										color: theme.colors.text,
									}}>
									{getStr(item.channel)}
								</Text>
								<Text
									style={{
										color: "gray",
										marginVertical: 2.5,
										marginHorizontal: 10,
									}}>
									{item.date}
								</Text>
							</View>
						</View>
						<TouchableOpacity
							onPress={() => navigation.navigate("NewsDetail", {detail: item})}>
							<Text
								style={{
									fontSize: 16,
									fontWeight: "bold",
									margin: 5,
									lineHeight: 20,
									color: theme.colors.text,
								}}>
								{item.name}
							</Text>
							<Text style={{margin: 5, lineHeight: 18}} numberOfLines={5}>
								<Text style={{fontWeight: "bold", color: theme.colors.text}}>
									{item.source + (item.source ? getStr(":") : "")}
								</Text>
								<Text style={{color: "gray"}}>
									{cache.get(item.url) ?? getStr("loading")}
								</Text>
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
		</>
	);
};

const styles = themedStyles(({colors}) => ({
	newsSliceContainer: {
		backgroundColor: colors.background,
		justifyContent: "center",
		padding: 15,
		marginVertical: 8,
		marginHorizontal: 16,
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

	titleContainer: {
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		margin: 5,
	},

	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		marginTop: 10,
		marginBottom: 5,
		marginHorizontal: 20,
	},

	textInputContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},

	textInputStyle: {
		height: 30,
		width: 60,
		backgroundColor: colors.background,
		color: colors.text,
		textAlign: "left",
		borderColor: "lightgrey",
		borderWidth: 1,
		borderRadius: 5,
		padding: 7,
	},

	footerContainer: {
		flexDirection: "row",
		alignSelf: "stretch",
		height: 80,
		justifyContent: "center",
		alignItems: "center",
	},
}));

export const NewsScreen = connect(
	(state: State) => {
		const cache = new Map<string, string>();
		state.cache.news.forEach(({url, abstract}: NewsCache) => {
			cache.set(url, abstract);
		});
		return {cache};
	},
	(dispatch) => ({
		addCache: (payload: NewsCache) => {
			dispatch(addNewsCacheAction(payload));
		},
	}),
)(NewsUI);
