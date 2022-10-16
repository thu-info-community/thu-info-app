import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 24 24" width={width} height={height}>
			<Path fillOpacity=".01" fill="white" d="M0 0h24v24H0z" />
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				stroke={theme.colors.fontB3}
				d="M15 18L9 12L15 6"
			/>
		</Svg>
	);
};
