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
				d="M10 18H4L4 6H44V18H38"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="M12 12L4 41H44L36 12H12Z"
			/>
		</Svg>
	);
});
