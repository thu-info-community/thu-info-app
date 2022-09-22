import React, {useEffect, useState} from "react";
import {
	Text,
	View,
	RefreshControl,
	TextInput,
	ScrollView,
	TouchableOpacity,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {StarRating} from "src/components/home/form";
import themes from "../../assets/themes/themes";
import {FormRouteProp, RootNav} from "../../components/Root";
import {useColorScheme} from "react-native";
import {helper} from "../../redux/store";
import {Form, Person} from "thu-info-lib/dist/models/home/assessment";
import themedStyles from "../../utils/themedStyles";
import {RoundedView} from "../../components/views";

export const FormScreen = ({
	route,
	navigation,
}: {
	route: FormRouteProp;
	navigation: RootNav;
}) => {
	const url: string = route.params.url;

	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const style = styles(themeName);

	const [refreshing, setRefreshing] = useState(true);
	const [evaluationForm, setEvaluationForm] = useState<Form>();
	// TODO: 'useState' may not be the best choice.

	const fetchForm = (_url: string) => {
		setRefreshing(true);
		helper
			.getAssessmentForm(_url)
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

	const renderEvaluation = (
		personList: Person[],
		personType: "teacher" | "assistant",
	) => {
		let evaluationList: JSX.Element[] = [];
		personList.forEach((person, i) => {
			evaluationList.push(
				<View
					style={[style.titleContainer, {marginTop: 24}]}
					key={`Teacher${i}Name`}>
					<View
						style={[
							style.titleIcon,
							{
								backgroundColor:
									personType === "teacher"
										? colors.themeGreen
										: colors.themeBlue,
							},
						]}
					/>
					<Text style={style.titleStyle}>
						{getStr(
							personType === "teacher"
								? "teacherEvaluation"
								: "assistantEvaluation",
						)}
						{getStr(":")}
						{person.name}
					</Text>
				</View>,
			);

			evaluationList.push(
				<RoundedView key={`Person${i}Questions`}>
					{person.inputGroups.map((inputGroup, index) => (
						<View key={`Person${i}Question${index}`}>
							{index > 0 && (
								<View
									style={{
										borderWidth: 0.4,
										marginHorizontal: 16,
										marginVertical: 12,
										borderColor: colors.themeGrey,
									}}
								/>
							)}
							<View style={{marginHorizontal: 12}}>
								<Text style={style.questionTextStyle}>
									{inputGroup.question ?? ""}
								</Text>
								<StarRating scoreRef={inputGroup.score} />
							</View>
						</View>
					))}
				</RoundedView>,
			);

			evaluationList.push(
				<RoundedView
					key={`Person${i}Suggestion`}
					style={{marginTop: 8, padding: 16}}>
					<TextInput
						style={{
							height: 100,
							textAlign: "left",
							alignSelf: "stretch",
							textAlignVertical: "top",
							color: colors.text,
						}}
						multiline={true}
						placeholder={
							personType === "teacher"
								? getStr("moreSuggestionsToTeacher")
								: getStr("moreSuggestionsToAssistant")
						}
						defaultValue={
							(personType === "teacher"
								? evaluationForm?.teachers[i]?.suggestion
								: evaluationForm?.assistants[i]?.suggestion) ?? ""
						}
						onChangeText={(text) => {
							if (evaluationForm) {
								if (personType === "teacher") {
									evaluationForm.teachers[i].suggestion = text;
								} else {
									evaluationForm.assistants[i].suggestion = text;
								}
							}
						}}
					/>
				</RoundedView>,
			);
		});
		return <View>{evaluationList}</View>;
	};

	const post = () => {
		setRefreshing(true);
		if (evaluationForm !== undefined) {
			const invalid = evaluationForm.invalid();
			if (invalid) {
				Snackbar.show({
					text: invalid,
					duration: Snackbar.LENGTH_LONG,
				});
				setRefreshing(false);
			} else {
				helper
					.postAssessmentForm(evaluationForm)
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
							duration: Snackbar.LENGTH_SHORT,
						});
						setRefreshing(false);
					});
			}
		}
	};

	useEffect(() => fetchForm(url), [url]);

	return (
		<ScrollView
			style={style.container}
			showsVerticalScrollIndicator={false}
			refreshControl={
				<RefreshControl refreshing={refreshing} colors={[colors.accent]} />
			}>
			<View style={[style.titleContainer, {marginTop: 16}]}>
				<View
					style={[style.titleIcon, {backgroundColor: colors.statusWarning}]}
				/>
				<Text style={style.titleStyle}>{getStr("generalImpression")}</Text>
			</View>
			{evaluationForm && (
				<RoundedView>
					<Text
						style={{
							color: colors.text,
							marginTop: 12,
							fontSize: 20,
							fontWeight: "bold",
							textAlign: "center",
						}}>
						{route.params.name}
					</Text>
					<View style={{marginTop: 8, alignItems: "center"}}>
						<StarRating scoreRef={evaluationForm.overall.score} />
					</View>
				</RoundedView>
			)}
			<RoundedView style={{marginTop: 8, padding: 16}}>
				<TextInput
					style={{
						height: 100,
						textAlign: "left",
						alignSelf: "stretch",
						textAlignVertical: "top",
						color: colors.text,
					}}
					multiline={true}
					placeholder={getStr("moreSuggestionsToCourse")}
					defaultValue={evaluationForm?.overall?.suggestion ?? ""}
					onChangeText={(text) => {
						if (evaluationForm) {
							evaluationForm.overall.suggestion = text;
						}
					}}
				/>
			</RoundedView>
			{evaluationForm && renderEvaluation(evaluationForm.teachers, "teacher")}
			{evaluationForm &&
				renderEvaluation(evaluationForm.assistants, "assistant")}
			<TouchableOpacity
				style={[
					style.buttonStyle,
					{
						backgroundColor:
							evaluationForm === undefined ? "lightgrey" : colors.primaryLight,
					},
				]}
				onPress={post}
				disabled={evaluationForm === undefined}>
				<Text style={style.buttonTextStyle}>{getStr("post")}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = themedStyles(({colors}) => ({
	container: {
		flex: 1,
		marginHorizontal: 17,
	},

	titleContainer: {
		flexDirection: "row",
		alignContent: "center",
		justifyContent: "flex-start",
		alignItems: "center",
		marginBottom: 8,
		marginTop: 24,
	},

	titleStyle: {
		fontWeight: "bold",
		fontSize: 16,
		marginHorizontal: 8,
		color: colors.text,
	},

	titleIcon: {
		width: 4,
		height: 16,
		borderRadius: 4,
	},

	textInputCaptionStyle: {
		alignSelf: "flex-start",
		marginTop: 20,
		marginBottom: 10,
		color: colors.text,
	},

	personNameStyle: {
		fontSize: 18,
		alignSelf: "center",
		marginVertical: 15,
		fontWeight: "bold",
		color: colors.text,
	},

	questionTextStyle: {
		fontSize: 16,
		marginBottom: 2,
		color: colors.text,
	},

	captionStyle: {
		alignSelf: "center",
		marginVertical: 5,
		color: colors.text,
	},

	buttonStyle: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 4,
		alignSelf: "flex-end",
		marginVertical: 40,
	},

	buttonTextStyle: {
		color: "white",
		fontWeight: "bold",
		fontSize: 20,
	},
}));
