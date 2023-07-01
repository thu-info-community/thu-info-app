import Svg, {Path, Rect} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Rect
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB3}
				rx={2}
				height={22}
				width={36}
				y={22}
				x={6}
			/>
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				stroke={theme.colors.fontB3}
				d="M14 22v-8c0-5.523 4.477-10 10-10s10 4.477 10 10v8M24 30v6"
			/>
		</Svg>
	);
};
