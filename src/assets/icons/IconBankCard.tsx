import Svg, {Path, Rect} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M14 13V9C14 7.89543 14.8954 7 16 7H42C43.1046 7 44 7.89543 44 9V27C44 28.1046 43.1046 29 42 29H40"
			/>
			<Rect
				x={4}
				y={19}
				width={30}
				height={22}
				rx={2}
				fill="none"
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4 28L34 28"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M34 23L34 35"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4 23L4 35"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M11 34L19 34"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M25 34L27 34"
			/>
		</Svg>
	);
};
