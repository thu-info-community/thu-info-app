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
				clipRule="evenodd"
				fillRule="evenodd"
				fill={theme.colors.text}
				d="M38.713 4.389v37.254H45V45h-9.556V7.583h-4.777V45H2v-3.357h4.778V2h23.889v2.389h8.046ZM10.889 42.222h16v-37h-16v37Z"
			/>
			<Path
				clipRule="evenodd"
				fillRule="evenodd"
				fill={theme.colors.text}
				d="M20.722 23.5a2.39 2.39 0 1 1 4.778 0 2.39 2.39 0 0 1-4.778 0Z"
			/>
		</Svg>
	);
});
