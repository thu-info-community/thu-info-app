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
import {State} from "../../redux/store";
import {configSet} from "../../redux/slices/config";

export const DeepSeekSettingsScreen = () => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	const enableBubbleMessage = useSelector(
		(s: State) => s.config.bubbleMessage,
	);
	const dispatch = useDispatch();
    return (
        <View style={{flex: 1, padding: 12, paddingTop: 0}}>
		<RoundedView style={style.rounded}>
			<View style={style.touchable}>
				<Text style={style.text}>{getStr("enableBubbleMessage")}</Text>
				<Switch
					thumbColor={colors.contentBackground}
					trackColor={{true: colors.themePurple}}
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
            </RoundedView>
        </View>
	);
};
