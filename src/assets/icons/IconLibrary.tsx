import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height}>
			<Path
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M32 6H22v36h10V6ZM42 6H32v36h10V6ZM10 6l8 1-3.5 35L6 41l4-35Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				d="M37 18v-3M27 18v-3"
			/>
		</Svg>
	);
};
