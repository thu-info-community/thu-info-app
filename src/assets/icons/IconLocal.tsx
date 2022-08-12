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
				fill={theme.colors.contentBackground}
				d="M0 0h48v48H0z"
			/>
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				stroke={theme.colors.primaryLight}
				d="M24 44s15-12 15-25c0-8.284-6.716-15-15-15-8.284 0-15 6.716-15 15 0 13 15 25 15 25Z"
			/>
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				stroke={theme.colors.primaryLight}
				d="M24 25a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
			/>
		</Svg>
	);
});
