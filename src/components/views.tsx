import React from "react";
import {useColorScheme, View, ViewProps} from "react-native";
import themes from "../assets/themes/themes";

export const RoundedView = (props: ViewProps) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return React.createElement(View, {
		...props,
		style: [
			{
				backgroundColor: colors.contentBackground,
				borderRadius: 12,
				paddingVertical: 16,
			},
			props.style,
		],
	});
};
