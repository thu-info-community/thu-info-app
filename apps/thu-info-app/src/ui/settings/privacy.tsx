import {WebView} from "react-native-webview";
import {View} from "react-native";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import {MOCK_APP_PRIVACY_URL} from "thu-info-lib/dist/mocks/app";

export const PrivacyScreen = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const dark = useSelector((s: State) => s.config.darkMode);
	return (
		<>
			<View
				style={{
					backgroundColor: theme.colors.themeBackground,
					flex: 1,
					padding: 15,
				}}>
				<WebView
					source={{
						uri:
							helper.userId.length === 0
								? MOCK_APP_PRIVACY_URL
								: helper.getPrivacyUrl(),
					}}
					containerStyle={{
						backgroundColor: theme.colors.themeBackground,
						color: theme.colors.text,
					}}
					setSupportMultipleWindows={false}
					forceDarkOn={dark || themeName === "dark"}
				/>
			</View>
		</>
	);
};
