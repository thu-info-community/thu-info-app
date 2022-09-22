import {NewsFavRouteProp, RootNav} from "../../components/Root";
import {
	Dimensions,
	FlatList,
	RefreshControl,
	Text,
	useColorScheme,
	View,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {NewsListItem} from "../../components/news/NewsListItem";
import React, {useState} from "react";
import {NewsSlice} from "thu-info-lib/dist/models/news/news";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";

export const NewsFavScreen = ({
	navigation,
	route,
}: {
	navigation: RootNav;
	route: NewsFavRouteProp;
}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	let screenHeight = Dimensions.get("window");
	const [inited, setInited] = useState(false);
	const [refreshing, setRefreshing] = useState(true);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [fetchedAll, setFetchedAll] = useState(false);
	const [newsList, setNewsList] = useState<NewsSlice[]>([]);

	const fetchNewsList = (request: boolean = true) => {
		if (!inited) {
			setInited(true);
		}
		setRefreshing(true);
		setLoading(true);

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
			.getFavorNewsList(request ? 1 : page + 1)
			.then((res) => {
				if (res[0].length === 0) {
					setFetchedAll(true);
				} else {
					setNewsList((o) => o.concat(res[0]));
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

	if (!inited) {
		fetchNewsList(true);
	}

	return (
		<View style={{flex: 1}}>
			<FlatList
				style={{margin: 12, marginBottom: 0}}
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
							{getStr("noFavNews")}
						</Text>
					</View>
				}
				data={newsList}
				keyExtractor={(item) => item.url}
				renderItem={({item}) => (
					<NewsListItem
						item={item}
						theme={theme}
						navigation={navigation}
						isFromFav={true}
						reloadFunc={route.params.reloadFunc}
					/>
				)}
				onEndReached={() => fetchNewsList(false)}
				onEndReachedThreshold={0.6}
			/>
		</View>
	);
};
