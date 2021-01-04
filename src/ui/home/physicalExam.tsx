import {Text, View} from "react-native";
import React from "react";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {getStr} from "src/utils/i18n";
import {helper} from "../../redux/store";

export const PhysicalExamScreen = simpleRefreshListScreen(
	helper.getPhysicalExamResult,
	([key, value]) => (
		<View style={{flexDirection: "row", alignItems: "center"}}>
			<Text
				style={{
					flex: 1,
					textAlign: "right",
					padding: 4,
					fontSize: 16,
					fontWeight: "bold",
					marginHorizontal: 10,
				}}>
				{key + getStr(":")}
			</Text>
			<Text
				style={{flex: 1, textAlign: "left", padding: 4, marginHorizontal: 10}}>
				{value}
			</Text>
		</View>
	),
	([x]) => x,
	undefined,
	undefined,
	undefined,
	27,
);
