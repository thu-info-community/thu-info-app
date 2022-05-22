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
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="M5 16L24 6L43 16L24 26L5 16Z"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="M11 20V34.464C11 35.9282 12.0551 37.1872 13.4711 37.5594C15.6758 38.139 19.0564 39.2194 22.3562 41.0292C23.3775 41.5893 24.6225 41.5893 25.6438 41.0292C28.9436 39.2194 32.3242 38.139 34.5289 37.5594C35.9449 37.1872 37 35.9282 37 34.464V20"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="M43 16L43 32"
			/>
		</Svg>
	);
});
