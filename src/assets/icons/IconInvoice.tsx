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
				d="M12 16v28h24V16"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="M18 32h12m-12-6h12M14 10h20m2 8h6V4H6v14h6"
			/>
		</Svg>
	);
});
