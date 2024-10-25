import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M35 38L30 33L34.9996 28"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M43 38L38 33L42.9996 28"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.mainTheme}
				d="M34.5 7V17H31V7"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M43 22V9C43 7.89543 42.1046 7 41 7H7C5.89543 7 5 7.89543 5 9V39C5 40.1046 5.89543 41 7 41H28.4706"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M13 15L18 21L23 15"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M12 27H24"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M12 21H24"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M18 21V33"
			/>
		</Svg>
	);
};
