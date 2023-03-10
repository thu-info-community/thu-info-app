import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				stroke={theme.colors.themePurple}
				d="M42 38v4H6v-4M30 6l10 10-10 10"
			/>
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				stroke={theme.colors.themePurple}
				d="M40 16C20 16 6 19 6 32"
			/>
		</Svg>
	);
};
