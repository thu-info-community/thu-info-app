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
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				d="M20 5.914h8v8h15v8H5v-8h15v-8Z"
				clipRule="evenodd"
			/>
			<Path
				strokeWidth="3"
				strokeLinejoin="round"
				fill={theme.colors.mainTheme}
				stroke={theme.colors.fontB1}
				d="M8 40h32V22H8v18Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				d="M16 39.898v-5.984M24 39.898v-6M32 39.898v-5.984M12 40h24"
			/>
		</Svg>
	);
});
