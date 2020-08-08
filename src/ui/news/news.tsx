import {
	StyleSheet,
	Text,
	View,
	RefreshControl,
	ActivityIndicator,
} from "react-native";
import React, {useState, useEffect} from "react";
import {newsSlice, getNewsList} from "src/network/news";
import {FlatList, TouchableOpacity} from "react-native-gesture-handler";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import AntDesign from "react-native-vector-icons/AntDesign";
import {NewsNav} from "./newsStack";
import {JWGG_MAIN_PREFIX} from "src/constants/strings";

export const NewsScreen = ({navigation}: {navigation: NewsNav}) => {
	const [newsList, setNewsList] = useState<newsSlice[]>([]);
	const [refreshing, setRefreshing] = useState(true);
	const [loading, setLoading] = useState(false);
	const [counter, setCounter] = useState(0);

	const fetchNewsList = () => {
		setRefreshing(true);
		setLoading(true);
		getNewsList(JWGG_MAIN_PREFIX + counter)
			.then((res) => {
				setNewsList(newsList?.concat(res));
				setCounter(counter + 1);
				setRefreshing(false);
				setLoading(false);
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_LONG,
				});
				setRefreshing(false);
				setLoading(false);
			});
	};

	useEffect(fetchNewsList, []);

	return (
		<FlatList
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={fetchNewsList} />
			}
			data={newsList}
			keyExtractor={(item) => "" + newsList.indexOf(item)}
			renderItem={({item}) => (
				<TouchableOpacity
					style={styles.newsSliceContainer}
					onPress={() => {
						navigation.navigate("NewsDetail", {url: item.url, name: item.name});
					}}>
					<View style={styles.titleContainer}>
						<AntDesign name="close" size={40} color="green" />
						<Text style={styles.titleStyle} numberOfLines={10}>
							{item.name}
						</Text>
					</View>
					<View style={styles.abstractContainer}>
						<Text style={styles.abstractStyle} numberOfLines={5}>
							It's abstract. It's abstract. It's abstract. It's abstract. It's
							abstract. It's abstract. It's abstract. It's abstract. It's
							abstract. It's abstract. It's abstract. It's abstract. It's
							abstract. It's abstract. It's abstract. It's abstract. It's
							abstract. It's abstract.
						</Text>
					</View>
					<View style={styles.footnoteContainer}>
						<Text>{item.source}</Text>
						<Text>{item.date}</Text>
					</View>
				</TouchableOpacity>
			)}
			onEndReached={fetchNewsList}
			onEndReachedThreshold={-0.15}
			ListFooterComponent={
				loading && counter !== 0 ? (
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
		justifyContent: "center",
		alignItems: "center",
		alignSelf: "center",
	},

	abstractContainer: {
		alignSelf: "center",
	},

	footnoteContainer: {
		marginTop: 5,
		marginHorizontal: 5,
		flexDirection: "row",
		justifyContent: "space-between",
		alignContent: "center",
		alignItems: "center",
	},

	footerContainer: {
		flexDirection: "row",
		alignSelf: "stretch",
		height: 100,
		justifyContent: "center",
		alignItems: "center",
	},

	titleStyle: {
		fontWeight: "bold",
		width: 300,
		marginLeft: 15,
	},

	abstractStyle: {
		fontSize: 14,
		color: "gray",
	},
});
