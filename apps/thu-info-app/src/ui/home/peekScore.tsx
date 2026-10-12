import {KeyboardAvoidingScreen} from "../../components/keyboardAvoidingScreen";
import {getStr} from "../../utils/i18n";
import {Text, ScrollView, TextInput, useColorScheme} from "react-native";
import {helper} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {PrimaryButton} from "../../components/subpage/buttons";
import {useState} from "react";
import {Snackbar} from "react-native-snackbar";

export const PeekScoreScreen = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [courseId, setCourseId] = useState("");
	const [courseName, setCourseName] = useState("");
	const [courseGrade, setCourseGrade] = useState("");
	const [querying, setQuerying] = useState(false);
	return (
		<KeyboardAvoidingScreen
			style={{
				flex: 1,
				marginHorizontal: 12,
				marginTop: 16,
				backgroundColor: colors.contentBackground,
			}}>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{
					flexGrow: 1,
					alignItems: "center",
					padding: 24,
				}}>
				<TextInput
					style={{
						color: colors.text,
						padding: 0,
						fontSize: 16,
						marginTop: 16,
						textAlign: "center",
					}}
					placeholder={getStr("enterCourseId")}
					placeholderTextColor={colors.fontB3}
					value={courseId}
					onChangeText={setCourseId}
				/>
				<Text
					style={{
						color: colors.text,
						fontSize: 14,
						marginHorizontal: 40,
						marginTop: 16,
						textAlign: "center",
					}}>
					{courseName}
				</Text>
				<Text
					style={{
						color: colors.text,
						fontSize: 14,
						marginHorizontal: 40,
						marginTop: 16,
						textAlign: "center",
					}}>
					{courseGrade}
				</Text>
				<Text
					style={{
						color: colors.text,
						fontSize: 14,
						marginHorizontal: 40,
						marginTop: 32,
						textAlign: "center",
					}}>
					{getStr("peekScorePrompt")}
				</Text>
				<PrimaryButton
					text={getStr(querying ? "querying" : "query")}
					onPress={() => {
						setQuerying(true);
						helper
							.getScoreByCourseId(courseId)
							.then(({name, grade}) => {
								setCourseName(name);
								setCourseGrade(grade);
							})
							.catch(() =>
								Snackbar.show({
									text: getStr("failure"),
									duration: Snackbar.LENGTH_SHORT,
								}),
							)
							.then(() => setQuerying(false));
					}}
					disabled={querying}
					style={{alignSelf: "center", marginTop: 32}}
				/>
			</ScrollView>
		</KeyboardAvoidingScreen>
	);
};
