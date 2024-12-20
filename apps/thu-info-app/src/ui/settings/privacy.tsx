import {WebView} from "react-native-webview";
import {BackHandler, Text, TouchableOpacity, View} from "react-native";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import {MOCK_APP_PRIVACY_URL} from "@thu-info/lib/src/mocks/app";
import {getStr} from "../../utils/i18n.ts";
import {RootNav} from "../../components/Root.tsx";
import {configSet} from "../../redux/slices/config.ts";

export const PrivacyScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const dark = useSelector((s: State) => s.config.darkMode);
	const privacy312 = useSelector((s: State) => s.config.privacy312);
	const dispatch = useDispatch();
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
								? "https://app.cs.tsinghua.edu.cn/privacy"
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
			{privacy312 !== true && <View style={{flex: 0, flexDirection: "row"}}>
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
