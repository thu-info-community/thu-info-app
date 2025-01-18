import {WebView} from "react-native-webview";
import {BackHandler, Platform, Text, TouchableOpacity, View} from "react-native";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import {MOCK_APP_PRIVACY_URL} from "@thu-info/lib/src/mocks/app";
import {getStr, langCode} from "../../utils/i18n";
import {RootNav} from "../../components/Root.tsx";
import {configSet} from "../../redux/slices/config.ts";

export const PrivacyScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const dark = useSelector((s: State) => s.config.darkMode);
	const privacy312 = useSelector((s: State) => s.config.privacy312);
	const dispatch = useDispatch();
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
					padding: 12,
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
			{(privacy312 !== true && !(Platform.OS === "android" || Platform.OS === "ios")) && <View style={{flex: 0, flexDirection: "row"}}>
				<TouchableOpacity
					style={{
						padding: 8,
						marginTop: 8,
						marginBottom: 24,
						marginHorizontal: 8,
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						borderRadius: 4,
						alignSelf: "flex-end",
						backgroundColor: theme.colors.themePurple,
					}}
					onPress={() => {
						dispatch(configSet({key: "privacy312", value: true}))
						navigation.pop();
					}}>
					<Text
						style={{
							color: "white",
							fontWeight: "400",
							fontSize: 16,
							lineHeight: 20,
						}}>
						{getStr("accept")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={{
						padding: 8,
						marginTop: 8,
						marginBottom: 24,
						marginHorizontal: 8,
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						borderRadius: 4,
						alignSelf: "flex-end",
						backgroundColor: theme.colors.themePurple,
					}}
					onPress={() => {
						dispatch(configSet({key: "privacy312", value: false}))
						BackHandler.exitApp();
					}}>
					<Text
						style={{
							color: "white",
							fontWeight: "400",
							fontSize: 16,
							lineHeight: 20,
						}}>
						{getStr("decline")}
					</Text>
				</TouchableOpacity>
			</View>}
		</>
	);
};
