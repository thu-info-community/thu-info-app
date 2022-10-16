import Svg, {Path, Rect} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height}>
			<Path fillOpacity=".01" fill="white" d="M0 0h48v48H0z" />
			<Rect
				x={6}
				y={4}
				width="26"
				height="40"
				rx="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M14 34H24"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M42 20v-6H23a5 5 0 1 0 0 6h19Z"
			/>
		</Svg>
	);
};
