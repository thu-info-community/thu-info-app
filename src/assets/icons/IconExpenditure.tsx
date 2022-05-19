import Svg, {Path, Rect} from "react-native-svg";
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
				strokeWidth="3"
				stroke={theme.colors.text}
				d="M14 13V9a2 2 0 0 1 2-2h26a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2h-2"
			/>
			<Rect
				strokeLinecap="square"
				strokeWidth="3"
				stroke={theme.colors.text}
				rx={2}
				height={22}
				width={30}
				y={19}
				x={4}
			/>
			<Path
				strokeLinecap="square"
				strokeWidth="3"
				stroke={theme.colors.text}
				d="M4 28h30M34 23v12M4 23v12M11 34h8M25 34h2"
			/>
		</Svg>
	);
});
