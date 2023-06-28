import {getStr} from "../../utils/i18n";
import {
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {helper} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {useState} from "react";

export const PeekScoreScreen = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [courseId, setCourseId] = useState("");
	const [courseName, setCourseName] = useState("");
	const [courseGrade, setCourseGrade] = useState("");
	return (
		<View
			style={{
				flex: 1,
				marginHorizontal: 12,
				marginTop: 16,
				backgroundColor: colors.contentBackground,
				alignItems: "center",
			}}>
			<TextInput
				style={{
					color: colors.text,
					padding: 0,
					fontSize: 16,
					marginTop: 56,
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
			<TouchableOpacity
				style={{marginTop: 32}}
				onPress={() => {
					helper.getScoreByCourseId(courseId).then(({name, grade}) => {
						setCourseName(name);
						setCourseGrade(grade);
					});
				}}>
				<RoundedView
					style={{
						backgroundColor: colors.statusWarning,
						paddingVertical: 8,
						paddingHorizontal: 32,
						borderRadius: 4,
					}}>
					<Text style={{color: "white", fontSize: 16}}>{getStr("query")}</Text>
				</RoundedView>
			</TouchableOpacity>
		</View>
	);
};
