import Svg, {Path, Rect} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const {colors} = themes(useColorScheme());
	return (
		<Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
			<Rect
				x="7"
				y="10"
				width="34"
				height="34"
				rx="5"
				stroke={colors.fontB1}
				strokeWidth="3"
			/>
			<Rect
				x="15"
				y="4"
				width="18"
				height="10"
				rx="3"
				fill={colors.mainTheme}
			/>
			<Path
				d="M14 25l3 3 5-6M27 25h7M14 35l3 3 5-6M27 35h7"
				stroke={colors.mainTheme}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};
