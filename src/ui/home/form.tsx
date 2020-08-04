import React, {useEffect, useState} from "react";
import {Text, StyleSheet, View, ActivityIndicator} from "react-native";
import {getAssessmentForm, postAssessmentForm} from "src/network/basics";
import {Form} from "src/models/home/assessment";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {
	TextInput,
	ScrollView,
	TouchableOpacity,
} from "react-native-gesture-handler";
import {StarRating} from "src/components/home/form";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export const FormScreen = ({route, navigation}: any) => {
	const url: string = route.params.url;

	const [refreshing, setRefreshing] = useState(true);
	const [evaluationForm, setEvaluationForm] = useState<Form>();
	// TODO: 'useState' may not be the best choice.

	const fetchForm = (_url: string) => {
		setRefreshing(true);
		getAssessmentForm(_url)
			.then((res: Form) => {
				setEvaluationForm(res);
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

	const renderEvaluation = (personList: any) => {
		let personListSize = personList.length;
		let evaluationList = [];
		if (personListSize !== 0) {
			for (let i = 0; i < personListSize; ++i) {
				evaluationList.push(
					<Text
						style={styles.personNameStyle}
						key={"Teacher" + i + " Name" + personList[i].name}>
						{personList[i].name}
					</Text>,
				);

				let questionListSize = personList[i].inputGroups.length;
				for (let j = 0; j < questionListSize; ++j) {
					evaluationList.push(
						<View
							style={styles.questionStyle}
							key={"Person" + i + " Question" + j}>
							<Text style={styles.questionTextStyle}>
								{personList[i].inputGroups[j].question ?? ""}
							</Text>
							<StarRating
								setValue={personList[i].inputGroups[j].score.value ?? "0"}
							/>
						</View>,
					);
				}
			}
		} else {
			evaluationList.push(
				<Text style={styles.captionStyle}>{getStr("noPersonToEvaluate")}</Text>,
			);
		}
		return <View>{evaluationList}</View>;
	};

	const post = () => {
		setRefreshing(true);
		if (evaluationForm !== undefined) {
			postAssessmentForm(evaluationForm)
				.then(() => {
					Snackbar.show({
						text: getStr("postSuccess"),
						duration: Snackbar.LENGTH_SHORT,
					});
					setRefreshing(false);
					navigation.pop();
				})
				.catch(() => {
					Snackbar.show({
						text: getStr("postFailure"),
						duration: Snackbar.LENGTH_LONG,
					});
					setRefreshing(false);
				});
		}
	};

	useEffect(() => {
		fetchForm(url);
	}, [url]);

	return (
		<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
			{refreshing ? (
				<View style={{marginTop: 10}}>
					<ActivityIndicator size="small" />
				</View>
			) : null}
			<View style={styles.titleContainer}>
				<FontAwesome name="chevron-right" color="red" size={18} />
				<Text style={styles.titleStyle}>{getStr("generalImpression")}</Text>
			</View>
			<StarRating setValue={evaluationForm?.overall.score.value ?? "0"} />
			<Text style={styles.textInputCaptionStyle}>
				{getStr("moreSuggestions")}
			</Text>
			<TextInput
				style={styles.textInputStyle}
				multiline={true}
				placeholder={getStr("inputSuggestions")}
				onChangeText={(text) => {
					if (evaluationForm) {
						evaluationForm.overall.suggestion = text;
					}
				}}
			/>
			<View style={styles.titleContainer}>
				<FontAwesome name="chevron-right" color="green" size={18} />
				<Text style={styles.titleStyle}>{getStr("teacherEvaluation")}</Text>
			</View>
			{renderEvaluation(evaluationForm?.teachers ?? [])}
			<View style={styles.titleContainer}>
				<FontAwesome name="chevron-right" color="blue" size={18} />
				<Text style={styles.titleStyle}>{getStr("assistantEvaluation")}</Text>
			</View>
			{renderEvaluation(evaluationForm?.assistants ?? [])}
			<TouchableOpacity style={styles.buttonStyle} onPress={post}>
				<Text style={styles.buttonTextStyle}>{getStr("post")}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginHorizontal: 17,
	},

	titleContainer: {
		flexDirection: "row",
		alignContent: "center",
		justifyContent: "flex-start",
		alignItems: "center",
		marginBottom: 10,
		marginTop: 15,
	},

	titleStyle: {
		fontWeight: "bold",
		fontSize: 18,
		marginHorizontal: 5,
	},

	textInputCaptionStyle: {
		alignSelf: "flex-start",
		marginTop: 20,
		marginBottom: 10,
	},

	textInputStyle: {
		height: 80,
		backgroundColor: "white",
		textAlign: "left",
		borderColor: "lightgrey",
		borderWidth: 1,
		borderRadius: 5,
		alignSelf: "stretch",
		padding: 10,
		marginBottom: 20,
	},

	personNameStyle: {
		fontSize: 18,
		alignSelf: "center",
		marginVertical: 15,
		fontWeight: "bold",
	},

	questionStyle: {
		marginVertical: 3,
	},

	questionTextStyle: {
		marginVertical: 2,
	},

	captionStyle: {
		alignSelf: "center",
		marginVertical: 5,
	},

	buttonStyle: {
		height: 35,
		width: 100,
		backgroundColor: "purple",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		alignSelf: "center",
		marginVertical: 10,
	},

	buttonTextStyle: {
		color: "white",
		fontWeight: "bold",
	},
});
