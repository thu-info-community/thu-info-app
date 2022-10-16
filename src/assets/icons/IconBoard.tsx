import Svg, {Path, Rect} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 15 15" width={width} height={height}>
			<Rect
				strokeLinecap="round"
				strokeLinejoin="round"
				x={0.890015}
				y={1.9668}
				width={11.8667}
				height={8.9}
				rx={0.593333}
				strokeWidth={1.18667}
				stroke={colors.fontB2}
			/>
			<Path
				strokeLinecap="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M3.85671 0.780273V3.15361"
			/>
			<Path
				strokeLinecap="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M7.12002 5.82314H3.85669"
			/>
			<Path
				strokeLinecap="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M9.79002 8.19716H3.85669"
			/>
			<Path
				strokeLinecap="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M9.79006 0.780273V3.15361"
			/>
		</Svg>
	);
};
