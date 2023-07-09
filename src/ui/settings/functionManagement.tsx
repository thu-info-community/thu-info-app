import {useState} from "react";
import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {ScrollView, Switch, Text, useColorScheme, View} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import themes from "../../assets/themes/themes";
import {configSet} from "../../redux/slices/config";
import {RoundedView} from "../../components/views";
import {styles} from "./settings";
import {HomeFunction} from "../home/home";
import {top5Set} from "../../redux/slices/top5";

// Function group names are also used as i18n keys
type functionGroups =
	| "functionManagementTip"
	| "seasonalFeatures"
	| "reservation"
	| "campusFinance"
	| "dorm"
	| "network";

const functions: {[key in functionGroups]: HomeFunction[]} = {
	functionManagementTip: ["report", "classroomState", "schoolCalendar"],
	seasonalFeatures: ["physicalExam", "teachingEvaluation"],
	reservation: ["library", "sportsBook", "libRoomBook"],
	campusFinance: ["expenditure", "bankPayment", "invoice"],
	dorm: ["washer", "qzyq", "dormScore", "electricity"],
	network: ["networkDetail", "onlineDevices"],
};

const FunctionItem = ({
	func,
	needSeparator,
	value,
	onValueChange,
}: {
	func: HomeFunction;
	value: boolean;
	needSeparator: boolean;
	onValueChange: (value: boolean) => void;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const style = styles(themeName);
	return (
		<>
			{needSeparator && <View style={style.separator} />}
			<View style={style.touchable}>
				<Text style={style.text}>{getStr(func as any)}</Text>
				<Switch
					thumbColor={colors.contentBackground}
					trackColor={{true: colors.themePurple}}
					value={value}
					onValueChange={onValueChange}
				/>
			</View>
		</>
	);
};

export const FunctionManagementScreen = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const style = styles(themeName);

	const homeFunctionDisabled = useSelector(
		(s: State) => s.config.homeFunctionDisabled,
	);
	const top5 = useSelector((s: State) => s.top5.top5Functions);
	const dispatch = useDispatch();

	const [disabledFuncList, setDisabledFuncList] =
		useState(homeFunctionDisabled);

	const handleValueChange = (f: HomeFunction, value: boolean) => {
		if (value) {
			// remove from disabled list
			if (disabledFuncList.includes(f)) {
				const payload = disabledFuncList.filter((i) => i !== f);
				setDisabledFuncList(payload);
				dispatch(configSet({key: "homeFunctionDisabled", value: payload}));
			}
		} else {
			// add to disabled list
			if (!disabledFuncList.includes(f)) {
				const payload = disabledFuncList.concat([f]);
				setDisabledFuncList(payload);
				dispatch(configSet({key: "homeFunctionDisabled", value: payload}));
				if (top5.includes(f)) {
					dispatch(top5Set(top5.filter((i) => i !== f))); // remove from top5
				}
			}
		}
	};

	const FunctionGroup = (name: functionGroups) => {
		return (
			<View key={name}>
				<Text style={{marginLeft: 8, color: colors.fontB2, marginTop: 12}}>
					{getStr(name)}
				</Text>
				<RoundedView style={[style.rounded, {marginTop: 12}]}>
					{functions[name].map((f, index) => (
						<FunctionItem
							key={f}
							func={f}
							needSeparator={index !== 0}
							value={!disabledFuncList.includes(f)}
							onValueChange={(value) => {
								handleValueChange(f, value);
							}}
						/>
					))}
				</RoundedView>
			</View>
		);
	};

	return (
		<ScrollView style={{flex: 1, padding: 12}}>
			{Object.keys(functions).map((name) =>
				FunctionGroup(name as functionGroups),
			)}
			<View style={{marginBottom: 16}} />
		</ScrollView>
	);
};
