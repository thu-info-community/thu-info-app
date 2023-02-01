import {
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {
	ASHITEMARU_URL,
	EVEELSEIF_URL,
	GITHUB_ORG_URL,
	Johnny_URL,
	UNIDY2002_URL,
	VZHAO_21_URL,
	WERKEYTOM_URL,
	YONGQI_URL,
} from "../../constants/strings";
import VersionNumber from "react-native-version-number";
import {useColorScheme} from "react-native";
import {checkUpdate} from "../../utils/checkUpdate";

const makeLinking = (url: string) =>
	Linking.openURL(url).then(() =>
		console.log("Opening " + url + " in system explorer"),
	);

export const AboutScreen = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	return (
		<ScrollView style={{paddingTop: 5, paddingBottom: 20, flex: 1}}>
			<Text
				style={[
					styles.textStyle,
					{color: theme.colors.text, fontSize: 20, fontWeight: "bold"},
				]}>
				THU Info
			</Text>
			<Text style={[styles.textStyle, {color: theme.colors.text}]}>
				{`${getStr("currentVersion")}V${VersionNumber.appVersion}`}
			</Text>
			<TouchableOpacity onPress={() => checkUpdate(true)}>
				<Text style={[styles.textStyle, {color: theme.colors.primaryLight}]}>
					{getStr("checkUpdate")}
				</Text>
			</TouchableOpacity>
			<View style={{height: 10}} />
			<Text style={[styles.textStyle, {color: theme.colors.text}]}>
				{getStr("maintainers")}
			</Text>
			<TouchableOpacity onPress={() => makeLinking(UNIDY2002_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 17},
					]}>
					UNIDY2002 @ GitHub
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => makeLinking(ASHITEMARU_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 17},
					]}>
					Ashitemaru @ GitHub
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => makeLinking(WERKEYTOM_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 17},
					]}>
					werkeytom @ GitHub
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => makeLinking(EVEELSEIF_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 17},
					]}>
					EveElseIf @ GitHub
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => makeLinking(YONGQI_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 17},
					]}>
					SauceCode @ GitHub
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => makeLinking(Johnny_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 17},
					]}>
					Johnny @ GitHub
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => makeLinking(VZHAO_21_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 17},
					]}>
					vzhao-21 @ GitHub
				</Text>
			</TouchableOpacity>
			<View style={{height: 10}} />
			<Text
				style={[styles.textStyle, {color: theme.colors.text, fontSize: 14}]}>
				{getStr("sourceText")}
			</Text>
			<TouchableOpacity onPress={() => makeLinking(GITHUB_ORG_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 14},
					]}>
					thu-info-community @ GitHub
				</Text>
			</TouchableOpacity>
			<View style={{flex: 1}} />
			<Text
				style={[styles.textStyle, {fontSize: 15, color: theme.colors.text}]}>
				© 2023 | thu-info-community
			</Text>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	textStyle: {
		textAlign: "center",
		padding: 10,
		fontSize: 17,
	},
});
