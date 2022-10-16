import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height}>
			<Path
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M4 14a2 2 0 0 1 2-2h36a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V14Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				d="m19 19 5 5 5-5M18 25h12M18 31h12M24 25v10M8 6h32"
			/>
		</Svg>
	);
};
