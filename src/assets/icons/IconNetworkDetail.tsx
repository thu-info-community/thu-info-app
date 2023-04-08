import Svg, {Path, Rect} from "react-native-svg";
import themes from "../themes/themes";
import {useColorScheme} from "react-native";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
			<Rect
				x="4"
				y="34"
				width="8"
				height="8"
				fill={theme.colors.mainTheme}
				stroke={theme.colors.fontB1}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Rect
				x="8"
				y="6"
				width="32"
				height="12"
				fill={theme.colors.mainTheme}
				stroke={theme.colors.fontB1}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M24 34V18"
				stroke={theme.colors.fontB1}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M8 34V26H40V34"
				stroke={theme.colors.fontB1}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Rect
				x="36"
				y="34"
				width="8"
				height="8"
				fill={theme.colors.mainTheme}
				stroke={theme.colors.fontB1}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Rect
				x="20"
				y="34"
				width="8"
				height="8"
				fill={theme.colors.mainTheme}
				stroke={theme.colors.fontB1}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M14 12H16"
				stroke={theme.colors.fontB1}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};
