import {WebView} from "react-native-webview";
import {View} from "react-native";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import {MOCK_APP_PRIVACY_URL} from "@thu-info/lib/src/mocks/app";
import {langCode} from "../../utils/i18n";

export const PrivacyScreen = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const dark = useSelector((s: State) => s.config.darkMode);
	const FORCE_DARK_JS = `
		(function() {
			const style = document.createElement("style");
			style.innerHTML = \`
				body {
					background-color: ${theme.colors.themeBackground} !important;
					color: ${theme.colors.text} !important;
				}
				nav {
					display: none !important;
				}
				footer {
					display: none !important;
				}
			\`;
			document.head.appendChild(style);
		}
	)();`;
	return (
		<>
			<View
				style={{
					backgroundColor: theme.colors.themeBackground,
					flex: 1,
				}}>
				<WebView
					source={{
						uri:
							`${helper.userId.length === 0
								? MOCK_APP_PRIVACY_URL
								: helper.getPrivacyUrl()
							}${langCode === "zh" ? "" : "-en"}`,
					}}
					containerStyle={{
						backgroundColor: theme.colors.themeBackground,
						color: theme.colors.text,
					}}
					setSupportMultipleWindows={false}
					forceDarkOn={dark || themeName === "dark"}
					injectedJavaScript={FORCE_DARK_JS}
					onMessage={() => { }}
				/>
			</View>
		</>
	);
};
