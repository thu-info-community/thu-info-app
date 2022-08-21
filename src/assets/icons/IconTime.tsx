import Svg, {Path} from "react-native-svg";
import React from "react";
import {svgGenerator} from "../../utils/svgGenerator";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default svgGenerator((width, height) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 15 15" width={width} height={height}>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				strokeLinejoin="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M7.11998 13.0532C10.3969 13.0532 13.0533 10.3967 13.0533 7.11986C13.0533 3.84297 10.3969 1.18652 7.11998 1.18652C3.84309 1.18652 1.18665 3.84297 1.18665 7.11986C1.18665 10.3967 3.84309 13.0532 7.11998 13.0532Z"
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M7.12243 3.55957L7.12207 7.12218L9.63763 9.63774"
			/>
		</Svg>
	);
});
