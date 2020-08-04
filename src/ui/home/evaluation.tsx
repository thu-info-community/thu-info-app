import React, {useEffect, useState} from "react";
import {FlatList, StyleSheet, View, Text} from "react-native";
import {getAssessmentList} from "../../network/basics";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import AntDesign from "react-native-vector-icons/AntDesign";
import {TouchableOpacity} from "react-native-gesture-handler";
import {HomeNav} from "./homeStack";

export const EvaluationScreen = ({navigation}: {navigation: HomeNav}) => {
	// eslint-disable-next-line prettier/prettier
	const [evaluationList, setEvaluationList] = useState<[string, boolean, string][]>();
	const [refreshing, setRefreshing] = useState(true);

	const fetchList = () => {
		setRefreshing(true);
		getAssessmentList()
			.then((res) => {
				setEvaluationList(res);
				setRefreshing(false);
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				});
				setRefreshing(false);
			});
	};

	const navigateToDetails = (_url: string, _name: string) => {
		setRefreshing(true);
		navigation.navigate("Form", {name: _name, url: _url});
		setRefreshing(false);
	};

	const setFullGrade = () => {};
	// TODO: Long Press

	useEffect(fetchList, []);

	return (
		<View style={styles.container}>
			<FlatList
				data={evaluationList}
				renderItem={({item}) => {
					return item[1] ? (
						<TouchableOpacity
							style={styles.evaluatedStyle}
							onPress={() => navigateToDetails(item[2], item[0])}>
							<Text style={styles.lessonNameStyle}>{item[0]}</Text>
							<View style={styles.iconContainerStyle}>
								<Text style={styles.captionStyle}>{getStr("evaluated")}</Text>
								<AntDesign name="check" size={20} color="green" />
							</View>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							style={styles.notEvaluatedStyle}
							onPress={() => navigateToDetails(item[2], item[0])}
							onLongPress={setFullGrade}>
							<Text style={styles.lessonNameStyle}>{item[0]}</Text>
							<View style={styles.iconContainerStyle}>
								<Text style={styles.captionStyle}>
									{getStr("notEvaluated")}
								</Text>
								<AntDesign name="close" size={20} color="red" />
							</View>
						</TouchableOpacity>
					);
				}}
				style={styles.listStyle}
				refreshing={refreshing}
				onRefresh={fetchList}
				keyExtractor={(item) => item[0]}
			/>
		</View>
	);
};
// TODO: Color theme

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		letterSpacing: 12,
	},

	absoluteContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		justifyContent: "center",
		alignItems: "center",
	},

	iconContainerStyle: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},

	blurViewStyle: {
		position: "absolute",
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
	},

	listStyle: {
		alignSelf: "stretch",
	},

	notEvaluatedStyle: {
		flexDirection: "row",
		backgroundColor: "white",
		justifyContent: "space-between",
		alignItems: "center",
		height: 50,
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

	evaluatedStyle: {
		flexDirection: "row",
		backgroundColor: "lightgrey",
		justifyContent: "space-between",
		alignItems: "center",
		height: 50,
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

	lessonNameStyle: {},

	captionStyle: {
		fontWeight: "bold",
		marginHorizontal: 5,
	},

	loadingCaptionStyle: {
		marginTop: 5,
	},
});
