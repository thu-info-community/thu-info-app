import {getStr} from "../../utils/i18n";
import {
	Switch,
	Text,
	useColorScheme,
	View,
} from "react-native";
import {RoundedView} from "../../components/views";
import {styles} from "./settings";
import themes from "../../assets/themes/themes";
import {useDispatch, useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import {configSet} from "../../redux/slices/config";
import {SubPageScreen} from "../../components/subpage/containers";

export const DeepSeekSettingsScreen = () => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);
	const userId = useSelector((s: State) => s.auth.userId);

	const deepseekEnabled = useSelector(
		(s: State) => s.config.deepseekEnabled,
	) ?? true;
	const enableBubbleMessage = useSelector(
		(s: State) => s.config.bubbleMessage,
	);
	const dispatch = useDispatch();
	if (userId === "" || helper.mocked()) {
		return null;
	}
	return (
		<SubPageScreen contentStyle={{paddingTop: 0}}>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("enableDeepSeek")}</Text>
					<Switch
						accessibilityLabel={getStr("enableDeepSeek")}
						accessibilityHint={getStr("enableDeepSeekHint")}
						ios_backgroundColor={colors.inputBorder}
						thumbColor={colors.themeLightGrey}
						trackColor={{false: colors.inputBorder, true: colors.themePurple}}
						value={deepseekEnabled}
						onValueChange={(value: boolean) => {
							dispatch(configSet({key: "deepseekEnabled", value}));
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
					{getStr("enableDeepSeekHint")}
				</Text>
			</RoundedView>
			{deepseekEnabled && <RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("enableBubbleMessage")}</Text>
					<Switch
						ios_backgroundColor={colors.inputBorder}
						thumbColor={colors.themeLightGrey}
						trackColor={{false: colors.inputBorder, true: colors.themePurple}}
						value={enableBubbleMessage}
						onValueChange={(value: boolean) => {
							dispatch(
								configSet({
									key: "bubbleMessage",
									value: value,
								}),
							);
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
					{getStr("bubbleMessageHint")}
				</Text>
			</RoundedView>}
		</SubPageScreen>
	);
};
