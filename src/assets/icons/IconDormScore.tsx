import {svgGenerator} from "../../utils/svgGenerator";
import Svg, {Path} from "react-native-svg";
import React from "react";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default svgGenerator((width, height) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" height={height} width={width}>
			<Path fillOpacity=".01" fill="#fff" d="M0 0h48v48H0z" />
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth="3"
				stroke="#333"
				d="M8 12a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v11H8V12zM6 35v4M42 35v4"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth="3"
				stroke="#333"
				fill={theme.colors.mainTheme}
				d="M29 18H19a3 3 0 0 0-3 3v2h16v-2a3 3 0 0 0-3-3z"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth="3"
				stroke="#333"
				d="M4 26a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v9H4v-9z"
			/>
		</Svg>
	);
});
