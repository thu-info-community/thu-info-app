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

export const ScheduleSettingsScreen = ({ navigation }: { navigation: RootNav }) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const { colors } = themes(themeName);

	const enableNewUI = useSelector((s: State) => s.config.scheduleEnableNewUI);
	const dispatch = useDispatch();

	return (
		<View style={{ flex: 1, padding: 12 }}>
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
							{ text: getStr("cancel") },
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
						]);
					}}>
					<Text style={style.text}>{getStr("scheduleSync")}</Text>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<IconRight height={20} width={20} />
					</View>
				</TouchableOpacity>
			</RoundedView>
			<Text
				style={{
					marginHorizontal: 12,
					marginVertical: 4,
					color: colors.fontB2,
					fontSize: 12,
				}}>
				{getStr("scheduleSyncTip")}
			</Text>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("enableNewUI")}</Text>
					<Switch
						thumbColor={colors.contentBackground}
						trackColor={{ true: colors.themePurple }}
						value={enableNewUI}
						onValueChange={(value) => {
							dispatch({
								type: "configSet",
								payload: {
									key: "scheduleEnableNewUI",
									value: value,
								},
							});
						}}
					/>
				</View>
			</RoundedView>
			<Text
				style={{
					marginHorizontal: 12,
					marginVertical: 4,
					color: colors.fontB2,
					fontSize: 12,
				}}>
				{getStr("scheduleNewUINotice")}
			</Text>
		</View>
	);
};
