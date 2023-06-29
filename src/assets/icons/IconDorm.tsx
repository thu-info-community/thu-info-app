import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M8 12a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v11H8V12ZM6 35v4M42 35v4"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M29 18H19a3 3 0 0 0-3 3v2h16v-2a3 3 0 0 0-3-3Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M4 26a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v9H4v-9Z"
			/>
		</Svg>
	);
};
