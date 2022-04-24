import React, {useEffect, useState} from "react";
import {FlatList, View, Text, RefreshControl} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import AntDesign from "react-native-vector-icons/AntDesign";
import {TouchableOpacity} from "react-native-gesture-handler";
import {RootNav} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {helper} from "../../redux/store";
import themedStyles from "../../utils/themedStyles";

export const EvaluationScreen = ({navigation}: {navigation: RootNav}) => {
	// eslint-disable-next-line prettier/prettier
	const [evaluationList, setEvaluationList] = useState<[string, boolean, string][]>();
	const [refreshing, setRefreshing] = useState(true);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	const fetchList = () => {
		setRefreshing(true);
		helper
			.getAssessmentList()
			.then((res) => {
				setEvaluationList(res);
				setRefreshing(false);
			})
			.catch((e) => {
				Snackbar.show({
					text: e?.message ?? getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				});
				setRefreshing(false);
			});
	};

	const setFullGrade = (_url: string) => {
		helper
			.getAssessmentForm(_url)
			.then((res) => {
				res.overall.score.value = "7";
				res.teachers.forEach((item) => item.autoScore());
				res.assistants.forEach((item) => item.autoScore());
				return helper.postAssessmentForm(res);
			})
			.then(() => {
				Snackbar.show({
					text: getStr("autoScoreSuccess"),
					duration: Snackbar.LENGTH_SHORT,
				});
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("autoScoreFailure"),
					duration: Snackbar.LENGTH_SHORT,
				});
			});
	};

	useEffect(fetchList, []);

	return (
		<View style={style.container}>
			<FlatList
				data={evaluationList}
				renderItem={({item}) => {
					return item[1] ? (
						<TouchableOpacity
							style={[
								style.evaluatedStyle,
								{
									backgroundColor:
										themeName === "light" ? "lightgrey" : "black",
								},
							]}
							onPress={() =>
								navigation.navigate("Form", {name: item[0], url: item[2]})
							}
							onLongPress={() => setFullGrade(item[2])}>
							<Text style={style.lessonNameStyle} numberOfLines={1}>
								{item[0]}
							</Text>
							<View style={style.iconContainerStyle}>
								<Text style={style.captionStyle}>{getStr("evaluated")}</Text>
								<AntDesign name="check" size={20} color="green" />
							</View>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							style={style.notEvaluatedStyle}
							onPress={() =>
								navigation.navigate("Form", {name: item[0], url: item[2]})
							}
							onLongPress={() => setFullGrade(item[2])}>
							<Text style={style.lessonNameStyle} numberOfLines={1}>
								{item[0]}
							</Text>
							<View style={style.iconContainerStyle}>
								<Text style={style.captionStyle}>{getStr("notEvaluated")}</Text>
								<AntDesign name="close" size={20} color="red" />
							</View>
						</TouchableOpacity>
					);
				}}
				style={style.listStyle}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={fetchList}
						colors={[theme.colors.accent]}
					/>
				}
				keyExtractor={(item) => item[0]}
			/>
		</View>
	);
};

const styles = themedStyles(({colors}) => ({
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
		backgroundColor: colors.background,
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

	lessonNameStyle: {
		color: colors.text,
		maxWidth: 200,
	},

	captionStyle: {
		fontWeight: "bold",
		marginHorizontal: 5,
		color: colors.text,
	},

	loadingCaptionStyle: {
		marginTop: 5,
	},
}));
