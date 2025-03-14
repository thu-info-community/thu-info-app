import {getStr} from "../../utils/i18n";
import {helper, State} from "../../redux/store";
import {useDispatch, useSelector} from "react-redux";
import {
	Alert,
	Platform,
	Switch,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {RootNav} from "../../components/Root";
import {RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import {styles} from "./settings";
import {configSet} from "../../redux/slices/config";
import themes from "../../assets/themes/themes";
import Snackbar from "react-native-snackbar";
import {logout} from "../../redux/slices/auth.ts";

export const AccountScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	const userId = useSelector((s: State) => s.auth.userId);
	const appSecret = useSelector((s: State) => s.credentials.appSecret);
	const disableBackgroundSecurityWarning = useSelector(
		(s: State) => s.config.disableBackgroundSecurityWarning,
	);
	const dispatch = useDispatch();

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("infoAccount")}</Text>
					<Text style={style.version}>{userId}</Text>
				</View>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => {
						if (appSecret === undefined) {
							navigation.navigate("AppSecret");
						} else {
							navigation.navigate("DigitalPassword", {
								action: "verify",
								target: "AppSecret",
							});
						}
					}}>
					<Text style={style.text}>{getStr("appSecret")}</Text>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text style={style.version}>
							{getStr(appSecret === undefined ? "notConfigured" : "configured")}
						</Text>
						<IconRight height={20} width={20} />
					</View>
				</TouchableOpacity>
			</RoundedView>
			{Platform.OS === "android" && (
				<RoundedView style={style.rounded}>
					<View style={style.touchable}>
						<Text style={style.text}>
							{getStr("backgroundSecurityWarning")}
						</Text>
						<Switch
							thumbColor={colors.contentBackground}
							trackColor={{true: colors.themePurple}}
							value={!disableBackgroundSecurityWarning}
							onValueChange={(value) => {
								dispatch(
									configSet({
										key: "disableBackgroundSecurityWarning",
										value: !value,
									}),
								);
							}}
						/>
					</View>
				</RoundedView>
			)}
			{helper.mocked() && (
				<RoundedView style={style.rounded}>
					<TouchableOpacity
						style={style.touchable}
						onPress={() => {
							Alert.alert(
								getStr("deleteAccountConfirm"),
								getStr("deleteAccountPrompt"),
								[
									{text: getStr("confirm"), onPress: () => {
										helper.logout();
										dispatch(logout());
										navigation.pop();
										setTimeout(() => {
											Snackbar.show({
												text: getStr("accountDeleted"),
												duration: Snackbar.LENGTH_LONG,
											});
										}, 800);
									}},
									{text: getStr("cancel")},
								]
							);
						}}>
						<Text style={style.text}>{getStr("deleteAccount")}</Text>
						<View style={{flexDirection: "row", alignItems: "center"}}>
							<IconRight height={20} width={20} />
						</View>
					</TouchableOpacity>
				</RoundedView>
			)}
		</View>
	);
};
