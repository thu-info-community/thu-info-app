import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({size, active}: {size: number; active: boolean}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const color = active ? theme.colors.mainTheme : "#0000";
	return (
		<Svg viewBox="0 0 48 48" width={size} height={size} fill="none">
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={color}
				d="M44 7H4v30h7v5l10-5h23V7Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M31 16v1M17 16v1M31 25s-2 4-7 4-7-4-7-4"
			/>
		</Svg>
	);
};
