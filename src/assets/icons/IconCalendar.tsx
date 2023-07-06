import Svg, {Path, Rect} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
			<Rect x="4" y="4" width="40" height="10" rx="4" fill={colors.mainTheme} />
			<Rect
				x="4"
				y="4"
				width="40"
				height="40"
				rx="4"
				stroke={colors.fontB1}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M4 14H44"
				stroke={colors.fontB1}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{Array.from(new Array(9), (_, k) => {
				const i = Math.floor(k / 3) + 1,
					j = k % 3;
				return (
					<Path
						key={k}
						d={`M${i}2 ${22 + 7 * j}H${i}6`}
						stroke={colors.fontB1}
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				);
			})}
		</Svg>
	);
};
