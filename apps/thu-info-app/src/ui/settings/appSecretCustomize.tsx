import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {Switch, Text, useColorScheme, View} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {styles} from "./settings";
import {configSet} from "../../redux/slices/config";
import {SubPageScreen} from "../../components/subpage/containers";

export const AppSecretCustomizeScreen = () => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	const {
		verifyPasswordBeforeEnterReport,
		verifyPasswordBeforeEnterFinance,
		verifyPasswordBeforeEnterPhysicalExam,
	} = useSelector((s: State) => s.config);
	const dispatch = useDispatch();

	return (
		<SubPageScreen scroll={false}>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("report")}</Text>
					<Switch
						ios_backgroundColor={colors.inputBorder}
						thumbColor={colors.themeLightGrey}
						trackColor={{false: colors.inputBorder, true: colors.themePurple}}
						value={verifyPasswordBeforeEnterReport === true}
						onValueChange={(value) => {
							dispatch(
								configSet({key: "verifyPasswordBeforeEnterReport", value}),
							);
						}}
					/>
				</View>
				<View style={style.separator} />
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("campusFinance")}</Text>
					<Switch
						ios_backgroundColor={colors.inputBorder}
						thumbColor={colors.themeLightGrey}
						trackColor={{false: colors.inputBorder, true: colors.themePurple}}
						value={verifyPasswordBeforeEnterFinance === true}
						onValueChange={(value) => {
							dispatch(
								configSet({key: "verifyPasswordBeforeEnterFinance", value}),
							);
						}}
					/>
				</View>
				<View style={style.separator} />
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("physicalExam")}</Text>
					<Switch
						ios_backgroundColor={colors.inputBorder}
						thumbColor={colors.themeLightGrey}
						trackColor={{false: colors.inputBorder, true: colors.themePurple}}
						value={verifyPasswordBeforeEnterPhysicalExam === true}
						onValueChange={(value) => {
							dispatch(
								configSet({
									key: "verifyPasswordBeforeEnterPhysicalExam",
									value,
								}),
							);
						}}
					/>
				</View>
			</RoundedView>
		</SubPageScreen>
	);
};
