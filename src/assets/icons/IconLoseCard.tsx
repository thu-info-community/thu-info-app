import Svg, {Path, Rect} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height}>
			<Rect
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.statusWarning}
				rx={2}
				height={32}
				width={40}
				y={8}
				x={4}
			/>
			<Path
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.statusWarning}
				d="M17 25a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.statusWarning}
				d="M23 31a6 6 0 0 0-12 0M28 20h8M30 28h6"
			/>
		</Svg>
	);
};
