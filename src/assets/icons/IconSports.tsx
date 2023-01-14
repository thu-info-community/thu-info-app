import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeMiterlimit={2}
				strokeWidth={3}
				d="M17.818 4.98C7.309 8.39 1.57 19.678 4.98 30.176c3.41 10.498 14.697 16.247 25.195 12.838 10.509-3.41 16.247-14.698 12.838-25.196C39.603 7.309 28.316 1.57 17.818 4.98Z"
				stroke={colors.fontB1}
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeMiterlimit={2}
				strokeWidth={3}
				d="m34 21-10-8-10 8 4 12h12l4-12Z"
				stroke={colors.fontB1}
				fill={colors.mainTheme}
			/>
			<Path
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeMiterlimit={2}
				strokeWidth={3}
				d="m34 21 9-3M36 40l-6-7M18 33l-6 7M14 21l-9-3M24 13V4"
				stroke={colors.fontB1}
				fill={colors.mainTheme}
			/>
		</Svg>
	);
};
