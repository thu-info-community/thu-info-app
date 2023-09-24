import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 128 128" width={width} height={height} fill="none">
			<Path
				clipRule="evenodd"
				fillRule="evenodd"
				fill={theme.colors.statusWarning}
				stroke={theme.colors.statusWarning}
				d="M64 13.3335L5.33331 114.667H122.667L64 13.3335Z"
				strokeWidth={5.33333}
				strokeLinejoin="round"
			/>
			<Path
				stroke="white"
				d="M64 93.3335V96.0002"
				strokeWidth={5.33333}
				strokeLinecap="round"
			/>
			<Path
				stroke="white"
				d="M64 50.6675L64.0221 77.3328"
				strokeWidth={5.33333}
				strokeLinecap="round"
			/>
		</Svg>
	);
};
