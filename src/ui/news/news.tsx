import {
	StyleSheet,
	Text,
	View,
	RefreshControl,
	ActivityIndicator,
	Animated,
} from "react-native";
import React, {useState, useEffect} from "react";
import {newsSlice, getNewsList, sourceTag} from "src/network/news";
import {
	FlatList,
	TouchableOpacity,
	TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import AntDesign from "react-native-vector-icons/AntDesign";
import {NewsNav} from "./newsStack";
import {
	JWGG_MAIN_PREFIX,
	BGTZ_MAIN_PREFIX,
	KYTZ_MAIN_PREFIX,
	HB_MAIN_PREFIX,
} from "src/constants/strings";

// TODO: Animation
// TODO: Number of news on one page
// TODO: Navigation
// TODO: Detail

class newsSourceList {
	private newsLoadList: Array<newsSlice[]>;
	private counterList: number[];

	private sourceList: string[] = [
		JWGG_MAIN_PREFIX,
		BGTZ_MAIN_PREFIX,
		KYTZ_MAIN_PREFIX,
		HB_MAIN_PREFIX,
	];

	private nameList: sourceTag[] = ["JWGG", "BGTZ", "KYTZ", "HB"];

	private async getLatestNews(): Promise<newsSlice> {
		for (let i = 0; i < 4; ++i) {
			if (this.newsLoadList[i].length === 0) {
				await getNewsList(
					this.sourceList[i] + this.counterList[i],
					this.nameList[i],
				).then((res) => {
					this.newsLoadList[i] = res;
					this.counterList[i] += 1;
				});
			}
		}

		let result: newsSlice = this.newsLoadList[0][0];
		let index: number = 0;
		this.newsLoadList.forEach((val, ind) => {
			if (val[0].date > result.date) {
				result = val[0];
				index = ind;
			}
		});

		this.newsLoadList[index].shift();
		return result;
	}

	public constructor() {
		this.newsLoadList = [[], [], [], []];
		this.counterList = [0, 0, 0, 0];
	}

	public reset() {
		this.newsLoadList = [[], [], [], []];
		this.counterList = [0, 0, 0, 0];
	}

	public async getLatestNewsList(listSize: number = 30): Promise<newsSlice[]> {
		let newsList = [];
		for (let i = 0; i < listSize; ++i) {
			newsList.push(await this.getLatestNews());
		}
		return newsList;
	}
}

export const NewsScreen = ({navigation}: {navigation: NewsNav}) => {
	const [newsList, setNewsList] = useState<newsSlice[]>([]);
	const [refreshing, setRefreshing] = useState(true);
	const [loading, setLoading] = useState(false);
	const [newsNumberOnOnePage, setNewsNumber] = useState(30);
	const [newsSource] = useState(new newsSourceList());

	const renderIcon = (channel: sourceTag) => {
		if (channel === "JWGG") {
			return <AntDesign name="close" size={40} color="green" />;
		} else if (channel === "BGTZ") {
			return <AntDesign name="close" size={40} color="red" />;
		} else if (channel === "KYTZ") {
			return <AntDesign name="close" size={40} color="blue" />;
		} else if (channel === "HB") {
			return <AntDesign name="close" size={40} color="purple" />;
		}
	};

	const fetchNewsList = (request: boolean = true) => {
		setRefreshing(true);
		setLoading(true);

		if (request) {
			setNewsList([]);
			newsSource.reset();
		}

		newsSource
			.getLatestNewsList()
			.then((res) => {
				setNewsList((o) => o.concat(res));
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_LONG,
				});
			});

		setRefreshing(false);
		setLoading(false);
	};

	useEffect(fetchNewsList, []);

	return (
		<FlatList
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={fetchNewsList} />
			}
			ListEmptyComponent={
				<View
					style={{
						margin: 15,
						height: 700,
						justifyContent: "center",
						alignItems: "center",
					}}>
					<Text style={{fontSize: 18, fontWeight: "bold", alignSelf: "center"}}>
						新闻较多，加载时间可能较长，请耐心等待。
					</Text>
				</View>
			}
			data={newsList}
			keyExtractor={(item: any) => "" + newsList.indexOf(item)}
			renderItem={({item}: any) => (
				<TouchableOpacity
					style={styles.newsSliceContainer}
					onPress={() => {
						navigation.navigate("NewsDetail", {url: item.url});
					}}>
					<View style={styles.titleContainer}>
						<TouchableWithoutFeedback>
							{renderIcon(item.channel)}
						</TouchableWithoutFeedback>
						<View>
							<Text
								style={{
									fontSize: 18,
									marginVertical: 2.5,
									marginHorizontal: 5,
								}}>
								{getStr(item.channel)}
							</Text>
							<Text
								style={{
									color: "gray",
									marginVertical: 2.5,
									marginHorizontal: 5,
								}}>
								{item.date}
							</Text>
						</View>
					</View>
					<Text
						style={{
							fontSize: 16,
							fontWeight: "bold",
							margin: 5,
							lineHeight: 20,
						}}>
						{item.name}
					</Text>
					<Text style={{margin: 5}} numberOfLines={5}>
						<Text style={{fontWeight: "bold"}}>
							{item.source + (item.source ? getStr(":") : "")}
						</Text>
						<Text style={{color: "gray"}}>
							It is abstract. It is abstract. It is abstract. It is abstract. It
							is abstract. It is abstract. It is abstract. It is abstract. It is
							abstract. It is abstract. It is abstract. It is abstract. It is
							abstract. It is abstract. It is abstract. It is abstract. It is
							abstract.{" "}
						</Text>
					</Text>
					<Text />
				</TouchableOpacity>
			)}
			onEndReached={() => {
				fetchNewsList(false);
				setNewsNumber(newsNumberOnOnePage + 30);
			}}
			onEndReachedThreshold={-0.15}
			ListFooterComponent={
				loading && newsList.length !== 0 ? (
					<View style={styles.footerContainer}>
						<ActivityIndicator size="small" />
						<Text style={{margin: 10}}>{getStr("loading")}</Text>
					</View>
				) : null
			}
		/>
	);
};

const styles = StyleSheet.create({
	newsSliceContainer: {
		backgroundColor: "white",
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
	},

	titleContainer: {
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		margin: 5,
	},

	footerContainer: {
		flexDirection: "row",
		alignSelf: "stretch",
		height: 80,
		justifyContent: "center",
		alignItems: "center",
	},
});
