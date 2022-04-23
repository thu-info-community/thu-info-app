import Svg, {Path, G} from "react-native-svg";
import React from "react";
import {svgGenerator} from "../../utils/svgGenerator";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default svgGenerator((width, height) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 43 43" width={width} height={height}>
			<G fillRule="evenodd" fill="none">
				<Path
					fillRule="nonzero"
					fill="#333"
					d="M36.713 39.643V4.389a2 2 0 0 0-2-2h-6.046V2a2 2 0 0 0-2-2H6.777a2 2 0 0 0-2 2v37.643H1.68a1.679 1.679 0 1 0 0 3.357h24.988a2 2 0 0 0 2-2V5.583h4.777V41a2 2 0 0 0 2 2h5.877a1.679 1.679 0 1 0 0-3.357h-4.608zm-14.824-1.42H11.556a2 2 0 0 1-2-2V6.777a2 2 0 0 1 2-2h10.333a2 2 0 0 1 2 2v29.444a2 2 0 0 1-2 2zM19.11 19.11a2.389 2.389 0 1 1 0 4.778 2.389 2.389 0 0 1 0-4.778z"
				/>
				<Path
					fill={theme.colors.mainTheme}
					d="M22.889 40.222h-12a2 2 0 0 1-2-2v-33a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v33a2 2 0 0 1-2 2z"
				/>
				<Path
					fill="#333"
					d="M21.111 19.111a2.389 2.389 0 1 1 0 4.778 2.389 2.389 0 0 1 0-4.778z"
				/>
			</G>
		</Svg>
	);
});
