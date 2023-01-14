import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeLinecap="square"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M28.375 38h-8.75L10 32.82V4h28v28.82L28.375 38ZM20 44h8v-6h-8v6Z"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M16 21a3 3 0 1 0 6 0v-6a3 3 0 1 0-6 0v6Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M28 38h-8v6h8v-6Z"
			/>
		</Svg>
	);
};
