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
				stroke={theme.colors.themePurple}
				d="M5.818 6.727V14h7.273"
			/>
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				stroke={theme.colors.themePurple}
				d="M4 24c0 11.046 8.954 20 20 20v0c11.046 0 20-8.954 20-20S35.046 4 24 4c-7.402 0-13.865 4.021-17.323 9.998"
			/>
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				stroke={theme.colors.themePurple}
				d="m24.005 12-.001 12.009 8.48 8.48"
			/>
		</Svg>
	);
});
