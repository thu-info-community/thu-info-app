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
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M11 21v15.039c0 .607.274 1.18.785 1.509C13.486 38.643 17.86 41 24 41c6.14 0 10.514-2.357 12.215-3.452.51-.33.785-.902.785-1.51V21"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				d="M43 24v8"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M5 17 24 7l19 10-19 10L5 17Z"
			/>
		</Svg>
	);
};
