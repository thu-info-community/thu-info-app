import Svg, {Path, Rect} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({size, active}: {size: number; active: boolean}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const color = active ? theme.colors.mainTheme : "#0000";
	return (
		<Svg viewBox="0 0 48 48" width={size} height={size} fill="none">
			<Rect
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={color}
				rx={2}
				height={30}
				width={40}
				y={10}
				x={4}
			/>
			<Path
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M14 6v8M25 23H14M34 31H14M34 6v8"
			/>
		</Svg>
	);
};
