import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path fill={theme.colors.mainTheme} d="M36 18h6V4H6v14h30Z" />
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M18 32h12m-12-6h12M14 10h20m2 8h6V4H6v14h30Z"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="square"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M12 18v26h24V18"
			/>
		</Svg>
	);
};
