import Svg, {Path, Rect, Circle} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path fillOpacity=".01" fill="white" d="M0 0h48v48H0z" />
			<Rect
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				rx={2}
				height={40}
				width={32}
				y={4}
				x={8}
			/>
			<Path
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M8 12a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v6Z"
			/>
			<Circle fill={theme.colors.fontB1} r={2} cy={9} cx={14} />
			<Circle fill={theme.colors.fontB1} r={2} cy={9} cx={20} />
			<Circle
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				strokeWidth={3}
				r={7}
				cy={29}
				cx={24}
			/>
		</Svg>
	);
};
