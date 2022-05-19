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
				fillOpacity=".01"
				fill={theme.colors.background}
				d="M0 0h48v48H0z"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="M8 12a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v11H8V12ZM6 35v4M42 35v4"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="M29 18H19a3 3 0 0 0-3 3v2h16v-2a3 3 0 0 0-3-3ZM4 26a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v9H4v-9Z"
			/>
		</Svg>
	);
});
