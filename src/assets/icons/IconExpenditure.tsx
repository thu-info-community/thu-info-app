import Svg, {Path, Rect} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				d="M14 13V9a2 2 0 0 1 2-2h26a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2h-2"
			/>
			<Rect
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				rx={2}
				height={22}
				width={30}
				y={19}
				x={4}
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				d="M4 28h30M34 23v12M4 23v12M11 34h8M25 34h2"
			/>
		</Svg>
	);
};
