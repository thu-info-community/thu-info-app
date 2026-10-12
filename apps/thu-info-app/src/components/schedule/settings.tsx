import {
	Alert,
	Pressable,
	Switch,
	Text,
	TouchableOpacity,
	View,
	useColorScheme,
} from "react-native";
import {ScrollView} from "react-native-gesture-handler";
import Slider from "@react-native-community/slider";
import {useDispatch, useSelector} from "react-redux";
import themes from "../../assets/themes/themes";
import IconRight from "../../assets/icons/IconRight";
import {configSet} from "../../redux/slices/config";
import type {State} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import {SchedulePeriodSwitch} from "./schedule";

export const ScheduleSettings = ({
	onClose,
	onManageHidden,
	onSync,
	onExport,
}: {
	onClose: () => void;
	onManageHidden: () => void;
	onSync: (isSending: boolean) => void;
	onExport: () => void;
}) => {
	const {colors} = themes(useColorScheme());
	const config = useSelector((s: State) => s.config);
	const dispatch = useDispatch();
	const rowStyle = {
		flexDirection: "row" as const,
		alignItems: "center" as const,
		justifyContent: "space-between" as const,
		paddingHorizontal: 16,
		paddingVertical: 8,
	};
	const textStyle = {color: colors.fontB1, fontSize: 16, flex: 1};
	const switches = [
		{key: "scheduleEnableNewUI", label: "enableNewUI", fallback: false},
		{key: "hideWeekend", label: "hideWeekend", fallback: false},
		{
			key: "showOfficialSchedule",
			label: "scheduleFilterOfficial",
			fallback: true,
		},
		{key: "showCustomSchedule", label: "scheduleFilterCustom", fallback: true},
	] as const;

	return (
		<View
			testID="schedule-settings"
			style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0}}>
			<Pressable
				testID="schedule-settings-backdrop"
				onPress={onClose}
				style={{
					position: "absolute",
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					backgroundColor: "#00000055",
				}}
			/>
			<ScrollView
				testID="schedule-settings-scroll"
				style={{
					flexGrow: 0,
					maxHeight: "100%",
					backgroundColor: colors.contentBackground,
				}}
				contentContainerStyle={{paddingBottom: 12}}>
				<View style={rowStyle}>
					<Text style={{color: colors.fontB1, fontSize: 16}}>
						{getStr("scheduleHeightLabel")}
					</Text>
					<Slider
						accessibilityLabel={getStr("scheduleHeightLabel")}
						style={{height: 40, flex: 1, marginLeft: 12}}
						minimumValue={0}
						maximumValue={20}
						step={1}
						value={config.scheduleHeightMode ?? 10}
						minimumTrackTintColor={colors.themePurple}
						maximumTrackTintColor={colors.inputBorder}
						thumbTintColor={colors.primary}
						onValueChange={(value) => {
							dispatch(configSet({key: "scheduleHeightMode", value}));
						}}
					/>
				</View>
				<SchedulePeriodSwitch />
				{switches.map(({key, label, fallback}) => (
					<View key={key} style={rowStyle}>
						<Text style={textStyle}>{getStr(label)}</Text>
						<Switch
							accessibilityLabel={getStr(label)}
							value={config[key] ?? fallback}
							ios_backgroundColor={colors.inputBorder}
							thumbColor={colors.themeLightGrey}
							trackColor={{false: colors.inputBorder, true: colors.themePurple}}
							onValueChange={(value) => {
								dispatch(configSet({key, value}));
							}}
						/>
					</View>
				))}
				<TouchableOpacity
					accessibilityRole="button"
					style={rowStyle}
					onPress={onManageHidden}>
					<Text style={textStyle}>{getStr("scheduleHidden")}</Text>
					<IconRight height={20} width={20} />
				</TouchableOpacity>
				<TouchableOpacity
					accessibilityRole="button"
					style={rowStyle}
					onPress={() => {
						Alert.alert(
							getStr("scheduleSync"),
							getStr("scheduleSyncTip"),
							[
								{text: getStr("syncSender"), onPress: () => onSync(true)},
								{text: getStr("syncReceiver"), onPress: () => onSync(false)},
							],
							{cancelable: true},
						);
					}}>
					<Text style={textStyle}>{getStr("scheduleSync")}</Text>
					<IconRight height={20} width={20} />
				</TouchableOpacity>
				<TouchableOpacity
					accessibilityRole="button"
					style={rowStyle}
					onPress={onExport}>
					<Text
						style={{
							color: colors.themePurple,
							fontSize: 16,
							fontWeight: "500",
							flex: 1,
							textAlign: "center",
						}}>
						{getStr("scheduleExportICS")}
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
};
