import {
	GestureResponderEvent,
	Platform,
	Text,
	TouchableHighlight,
	TouchableNativeFeedback,
	useColorScheme,
	View,
} from "react-native";
import React from "react";
import themes from "../../assets/themes/themes";
import {Project} from "thu-info-lib/dist/models/gitlab/gitlab";
import {getStr} from "../../utils/i18n";
import TimeAgo from "react-native-timeago";

export const ProjectItem = ({
	project,
	onPress,
}: {
	project: Project;
	onPress: (event: GestureResponderEvent) => void;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const content = (
		<View
			style={{
				padding: 8,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<View
				style={{flexDirection: "column", flex: 3, alignItems: "flex-start"}}>
				<Text style={{fontSize: 13, marginHorizontal: 10, color: "grey"}}>
					{project.path_with_namespace}
				</Text>
				<Text style={{fontSize: 17, marginHorizontal: 10, color: colors.text}}>
					{project.name}
				</Text>
			</View>
			<View style={{flexDirection: "column", flex: 1, alignItems: "flex-end"}}>
				<Text style={{fontSize: 14, marginHorizontal: 6, color: colors.text}}>
					{getStr("gitlabLastUpdate")}
				</Text>
				<Text style={{fontSize: 14, marginHorizontal: 6, color: colors.text}}>
					<TimeAgo time={project.last_activity_at} />
				</Text>
			</View>
		</View>
	);
	return Platform.OS === "ios" ? (
		<TouchableHighlight underlayColor="#0002" onPress={onPress}>
			{content}
		</TouchableHighlight>
	) : (
		<TouchableNativeFeedback
			background={TouchableNativeFeedback.Ripple("#0002", false)}
			onPress={onPress}>
			{content}
		</TouchableNativeFeedback>
	);
};
