import Svg, {Path} from "react-native-svg";
import React from "react";
import {svgGenerator} from "../../utils/svgGenerator";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default svgGenerator((width, height) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height}>
			<Path
				strokeWidth={2}
				strokeLinejoin="round"
				stroke={colors.fontB1}
				d="m23.999 5-6.113 12.478L4 19.49l10.059 9.834L11.654 43 24 36.42 36.345 43 33.96 29.325 44 19.491l-13.809-2.013L24 5Z"
			/>
		</Svg>
	);
});
