import React from "react";
import {View, Text, TouchableOpacity} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import IconRight from "../../assets/icons/IconRight";
import IconCheckGrey from "../../assets/icons/IconCheckGrey";
import {roundedRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {helper} from "../../redux/store";

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

export const EvaluationScreen = roundedRefreshListScreen(
	helper.getAssessmentList,
	([name, evaluated, url], refresh, {navigation}, theme, index, total) => {
		const {colors} = theme;
		return (
			<TouchableOpacity
				style={{
					marginTop: index === 0 ? 0 : 12,
					marginBottom: index === total - 1 ? 0 : 12,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: 4,
				}}
				onPress={() => navigation.navigate("Form", {name, url})}
				onLongPress={() => {
					setFullGrade(url);
					refresh();
				}}>
				<Text style={{color: colors.text, fontSize: 16}} numberOfLines={1}>
					{name}
				</Text>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "center",
						alignItems: "center",
					}}>
					<Text
						style={{
							marginHorizontal: 4,
							fontSize: 16,
							color: colors.fontB2,
						}}>
						{getStr(evaluated ? "evaluated" : "notEvaluated")}
					</Text>
					{evaluated ? (
						<IconCheckGrey height={20} width={20} />
					) : (
						<IconRight height={20} width={20} />
					)}
				</View>
			</TouchableOpacity>
		);
	},
	([name]) => name,
);
