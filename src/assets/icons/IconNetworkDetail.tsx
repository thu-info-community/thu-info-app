import Svg, {Path, Rect} from "react-native-svg";
import themes from "../themes/themes";
import {useColorScheme} from "react-native";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 656 656" width={width} height={height}>
			<Path
				d="m481.07,655.97v-174.92h65.59v-131.2h-196.79v131.2h65.59v174.92h-174.92v-174.92h65.59v-131.2H109.34v131.2h65.59v174.92H0v-174.92h65.59v-174.92h240.51v-131.2h-65.59V0h174.93v174.92h-65.59v131.2h240.52v174.92h65.59v174.92h-174.93.05Zm131.18-131.2"
				fill={theme.colors.fontB1}
			/>
			<Rect
				x="524.8"
				y="524.77"
				width="87.45"
				height="87.45"
				fill={theme.colors.mainTheme}
			/>
			<Rect
				x="284.29"
				y="524.77"
				width="87.45"
				height="87.45"
				fill={theme.colors.mainTheme}
			/>
			<Rect
				x="43.78"
				y="524.77"
				width="87.45"
				height="87.45"
				fill={theme.colors.mainTheme}
			/>
			<Rect
				x="284.29"
				y="43.75"
				width="87.45"
				height="87.45"
				fill={theme.colors.mainTheme}
			/>
		</Svg>
	);
};
