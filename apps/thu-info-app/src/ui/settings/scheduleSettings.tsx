import { getStr } from "../../utils/i18n";
import {
	Alert,
	Switch,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import { RootNav } from "../../components/Root";
import { RoundedView } from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import { styles } from "./settings";
import themes from "../../assets/themes/themes";
import { useDispatch, useSelector } from "react-redux";
import { State } from "../../redux/store";
import { configSet } from "../../redux/slices/config";

export const ScheduleSettingsScreen = ({ navigation }: { navigation: RootNav }) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const { colors } = themes(themeName);

	const scheduleEnableNewUI = useSelector((s: State) => s.config.scheduleEnableNewUI);
	const dispatch = useDispatch();

	return (
		<View style={{ flex: 1, padding: 12, paddingTop: 0 }}>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => {
						navigation.navigate("ScheduleHidden");
					}}>
					<Text style={style.text}>{getStr("scheduleHidden")}</Text>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<IconRight height={20} width={20} />
					</View>
				</TouchableOpacity>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => {
						Alert.alert(getStr("scheduleSync"), getStr("scheduleSyncTip"), [
							{
								text: getStr("syncSender"),
								onPress: () => {
									navigation.navigate("ScheduleSync", {
										isSending: true,
									});
								},
							},
							{
								text: getStr("syncReceiver"),
								onPress: () => {
									navigation.navigate("ScheduleSync", {
										isSending: false,
									});
								},
							},
						], {cancelable: true});
					}}>
					<Text style={style.text}>{getStr("scheduleSync")}</Text>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<IconRight height={20} width={20} />
					</View>
				</TouchableOpacity>
				<Text
					style={{
						marginHorizontal: 16,
						marginTop: 8,
						color: colors.fontB3,
						fontSize: 12,
					}}>
					{getStr("scheduleSyncTip")}
				</Text>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("enableNewUI")}</Text>
					<Switch
						thumbColor={colors.contentBackground}
						trackColor={{ true: colors.themePurple }}
						value={scheduleEnableNewUI}
						onValueChange={(value: boolean) => {
							dispatch(configSet({
								key: "scheduleEnableNewUI",
								value: value,
							}));
						}}
					/>
				</View>
				<Text
					style={{
						marginHorizontal: 16,
						marginTop: 8,
						color: colors.fontB3,
						fontSize: 12,
					}}>
					{getStr("scheduleNewUINotice")}
				</Text>
			</RoundedView>
		</View>
	);
};
