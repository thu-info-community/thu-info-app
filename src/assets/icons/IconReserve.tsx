import Svg, {Path} from "react-native-svg";
import themes from "../themes/themes";
import {useColorScheme} from "react-native";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height}>
			<Path fillOpacity=".01" fill="white" d="M0 0h48v48H0z" />
			<Path
				strokeLinejoin="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4 4 12.954 4 24s8.954 20 20 20Z"
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth="3"
				stroke={theme.colors.fontB1}
				d="M24.008 12v12.009l8.479 8.48"
			/>
		</Svg>
	);
};
