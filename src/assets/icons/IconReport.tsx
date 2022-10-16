import Svg, {Path} from "react-native-svg";
import themes from "../themes/themes";
import {useColorScheme} from "react-native";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height}>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				d="M26 36H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h36a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2h-8M12 14h24M12 21h6M12 28h4"
			/>
			<Path
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M30 33a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="m30 40 4 2V31.472S32.86 33 30 33c-2.86 0-4-1.5-4-1.5V42l4-2Z"
			/>
		</Svg>
	);
};
