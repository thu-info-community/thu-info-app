import {StyleSheet, Text, View} from "react-native";
import React, {useState, useEffect} from "react";
import {newsSlice, getNewsList} from "src/network/news";
import {
	FlatList,
	TouchableOpacity,
	TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import AntDesign from "react-native-vector-icons/AntDesign";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import {NewsNav} from "./newsStack";

export const NewsScreen = ({navigation}: {navigation: NewsNav}) => {
	const [newsList, setNewsList] = useState<newsSlice[]>();
	const [refreshing, setRefreshing] = useState(true);

	const fetchNewsList = () => {
		setRefreshing(true);
		getNewsList()
			.then((res) => {
				setNewsList(res);
				setRefreshing(false);
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_LONG,
				});
				setRefreshing(false);
			});
	};

	useEffect(fetchNewsList, []);

	return (
		<FlatList
			refreshing={refreshing}
			onRefresh={fetchNewsList}
			data={newsList}
			keyExtractor={(item) => item.name}
			renderItem={({item}) => (
				<TouchableOpacity
					style={styles.newsSliceContainer}
					onPress={() => {
						navigation.navigate("NewsDetail", {url: item.url});
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
							abstract. It's abstract. It's abstract.
						</Text>
					</View>
					<View style={styles.footnoteContainer}>
						<Text>{item.source}</Text>
						<Text>{item.date}</Text>
					</View>
				</TouchableOpacity>
			)}
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
