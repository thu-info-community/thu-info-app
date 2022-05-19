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
				d="M10 17v27h28V17"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="m5 22 5-5L24 4l14 13 5 5"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="m19 19 5 6 5-6M18 31h12M18 25h12M24 25v12"
			/>
		</Svg>
	);
});
