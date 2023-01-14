import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 18 18" width={width} height={height} fill="none">
			<Path fillOpacity=".01" fill="white" d="M18 0H0V18H18V0Z" />
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.125}
				stroke={theme.colors.fontB2}
				d="M15.75 7.125H2.25"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.125}
				stroke={theme.colors.fontB2}
				d="M11.25 2.625L15.75 7.125"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.125}
				stroke={theme.colors.fontB2}
				d="M2.5496 10.875H16.0496"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.125}
				stroke={theme.colors.fontB2}
				d="M2.5496 10.875L7.04962 15.375"
			/>
		</Svg>
	);
};
