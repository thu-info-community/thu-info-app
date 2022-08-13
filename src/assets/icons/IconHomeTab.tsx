import Svg, {Path} from "react-native-svg";
import React from "react";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({size, active}: {size: number; active: boolean}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const color = active ? theme.colors.mainTheme : "#0000";
	return (
		<Svg viewBox="0 0 48 48" width={size} height={size}>
			<Path fillOpacity=".01" fill="white" d="M0 0h48v48H0z" />
			<Path fill={color} d="M9 18v24h30V18L24 6 9 18Z" />
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M9 42V18l-5 4L24 6l20 16-5-4v24H9Z"
			/>
			<Path
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={color}
				d="M19 29v13h10V29H19Z"
			/>
			<Path
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M9 42h30"
			/>
		</Svg>
	);
};
