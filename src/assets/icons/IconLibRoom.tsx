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
			<Rect
				x={6}
				y={4}
				width="26"
				height="40"
				rx="2"
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="M14 34H24"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.text}
				d="M42 20V14H23.0004C22.0882 12.7856 20.6358 12 19 12C16.2386 12 14 14.2386 14 17C14 19.7614 16.2386 22 19 22C20.6358 22 22.0882 21.2144 23.0004 20H42Z"
			/>
		</Svg>
	);
});
