import {Text, View} from "react-native";
import React from "react";
import {roundedRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {helper} from "../../redux/store";

export const PhysicalExamScreen = roundedRefreshListScreen(
	helper.getPhysicalExamResult,
	([key, value], _, __, {colors}, index, total) => (
		<View
			style={{
				marginTop: index === 0 ? 0 : 12,
				marginBottom: index === total - 1 ? 0 : 12,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}>
			<Text
				style={{
					fontSize: 16,
					color: colors.text,
				}}>
				{key}
			</Text>
			<Text
				style={{
					fontSize: 16,
					color: colors.fontB3,
				}}>
				{value}
			</Text>
		</View>
	),
	([x]) => x,
);
