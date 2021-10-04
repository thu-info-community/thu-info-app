import React from "react";
import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import {ScheduleScreen} from "./schedule";
import {getStr} from "../../utils/i18n";
import {ScheduleAddScreen} from "./scheduleAdd";
import {ScheduleHiddenScreen} from "./scheduleHidden";
import {ScheduleDetailScreen, ScheduleDetailProps} from "./scheduleDetail";
import {TouchableOpacity, useColorScheme, View} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import themes from "../../assets/themes/themes";
import {saveImg} from "../../utils/saveImg";
import {globalObjects} from "../../redux/store";

type ScheduleStackParamList = {
	Schedule: undefined;
	ScheduleAdd: undefined;
	ScheduleHidden: undefined;
	ScheduleDetail: ScheduleDetailProps;
};

const Stack = createStackNavigator<ScheduleStackParamList>();

export type ScheduleNav = StackNavigationProp<ScheduleStackParamList>;

export const ScheduleStackScreen = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	return (
		<Stack.Navigator>
			<Stack.Screen
				name="Schedule"
				component={ScheduleScreen}
				options={({navigation}) => ({
					title: getStr("schedule"),
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() => {
									if (
										globalObjects.scheduleViewShot !== null &&
										globalObjects.scheduleViewShot.current !== null &&
										globalObjects.scheduleViewShot.current.capture
									) {
										globalObjects.scheduleViewShot.current
											.capture()
											.then(saveImg);
									}
								}}>
								<Icon name="camera" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() => navigation.navigate("ScheduleHidden")}>
								<Icon name="eye-slash" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() => navigation.navigate("ScheduleAdd")}>
								<Icon name="plus" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Stack.Screen
				name="ScheduleAdd"
				component={ScheduleAddScreen}
				options={{title: getStr("scheduleAddCustom")}}
			/>
			<Stack.Screen
				name="ScheduleHidden"
				component={ScheduleHiddenScreen}
				options={{title: getStr("scheduleHidden")}}
			/>
			<Stack.Screen
				name="ScheduleDetail"
				component={ScheduleDetailScreen}
				options={{title: getStr("scheduleDetail")}}
			/>
		</Stack.Navigator>
	);
};
