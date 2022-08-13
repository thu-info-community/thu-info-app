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
			<Path fillOpacity=".01" fill="white" d="M0 0h48v48H0z" />
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M36 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM14 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM14 44a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
				clipRule="evenodd"
				fillRule="evenodd"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M14 12v24-3c0-8 22-9 22-17v-4"
			/>
		</Svg>
	);
});
