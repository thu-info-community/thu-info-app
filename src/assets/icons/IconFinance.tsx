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
				strokeWidth="3"
				stroke={theme.colors.text}
				d="M4 14a2 2 0 0 1 2-2h36a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V14Z"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth="3"
				stroke={theme.colors.text}
				d="m19 19 5 5 5-5M18 25h12M18 31h12M24 25v10M8 6h32"
			/>
		</Svg>
	);
});
