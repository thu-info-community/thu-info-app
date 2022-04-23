import Svg, {Path} from "react-native-svg";
import React from "react";
import {svgGenerator} from "../../utils/svgGenerator";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default svgGenerator((width, height) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height}>
			<Path
				strokeLinejoin="round"
				strokeWidth="3"
				stroke="#333"
				fill={theme.colors.mainTheme}
				d="M32 6H22v36h10V6zM42 6H32v36h10V6zM10 6l8 1-3.5 35L6 41l4-35z"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth="3"
				stroke="#333"
				d="M37 18v-3M27 18v-3"
			/>
		</Svg>
	);
});
