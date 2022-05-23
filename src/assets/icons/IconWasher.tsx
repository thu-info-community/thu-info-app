import Svg, {Path, Rect, Circle} from "react-native-svg";
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
			<Rect
				strokeWidth="3"
				stroke={theme.colors.text}
				rx={2}
				height={40}
				width={32}
				y={4}
				x={8}
			/>
			<Path
				strokeWidth="3"
				stroke={theme.colors.text}
				d="M8 12a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v6Z"
			/>
			<Circle fill={theme.colors.text} r={2} cy={9} cx={14} />
			<Circle fill={theme.colors.text} r={2} cy={9} cx={20} />
			<Circle
				stroke={theme.colors.text}
				strokeWidth={3}
				r={7}
				cy={29}
				cx={24}
			/>
		</Svg>
	);
});
