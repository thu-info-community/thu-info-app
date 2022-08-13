import Svg, {Path} from "react-native-svg";
import React from "react";
import {svgGenerator} from "../../utils/svgGenerator";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default svgGenerator((width, height) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" height={height} width={width}>
			<Path
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M12 12.28a.28.28 0 0 1 .28-.28h23.44a.28.28 0 0 1 .28.28V24c0 6.627-5.373 12-12 12s-12-5.373-12-12V12.28Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				d="M20 12V4M28 12V4M22 27h4M24 36v5a3 3 0 0 0 3 3h11"
			/>
		</Svg>
	);
});
