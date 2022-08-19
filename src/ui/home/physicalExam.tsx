import {Text, View} from "react-native";
import React from "react";
import {roundedRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {getStr} from "src/utils/i18n";
import {helper} from "../../redux/store";

export const PhysicalExamScreen = roundedRefreshListScreen(
	helper.getPhysicalExamResult,
	([key, value], _, __, {colors}) => (
		<View style={{flexDirection: "row", alignItems: "center"}}>
			<Text
				style={{
					flex: 1,
					textAlign: "right",
					padding: 4,
					fontSize: 16,
					fontWeight: "bold",
					marginHorizontal: 10,
					color: colors.text,
				}}>
				{key + getStr(":")}
			</Text>
			<Text
				style={{
					flex: 1,
					textAlign: "left",
					padding: 4,
					marginHorizontal: 10,
					color: colors.text,
				}}>
				{value}
			</Text>
		</View>
	),
	([x]) => x,
);
