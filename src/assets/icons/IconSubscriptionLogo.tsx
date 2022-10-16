import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg width={width} height={height} viewBox="0 0 128 128" fill="none">
			<Path d="M128 0H0V128H128V0Z" fill="white" fillOpacity="0.01" />
			<Path
				d="M21 117.333V16.0001C21 13.0546 23.3878 10.6667 26.3333 10.6667H101C103.946 10.6667 106.333 13.0546 106.333 16.0001V117.333L63.6667 95.2729L21 117.333Z"
				fill={colors.themePurple}
				stroke={colors.themePurple}
				strokeWidth="8"
				strokeLinejoin="round"
			/>
			<Path
				d="M64 37.1992V69.1992"
				stroke={colors.contentBackground}
				strokeWidth="8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M48 53.1992H80"
				stroke={colors.contentBackground}
				strokeWidth="8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};
