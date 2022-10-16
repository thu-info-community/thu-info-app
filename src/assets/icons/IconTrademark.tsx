import Svg, {Circle, Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 14 14" width={width} height={height}>
			<Circle
				cx={6.83333}
				cy={6.83333}
				r={5.83333}
				strokeWidth={1.16667}
				stroke={colors.fontB2}
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.16667}
				stroke={colors.fontB2}
				d="M9.16667 4.50033H4.5"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.16667}
				stroke={colors.fontB2}
				d="M6.83333 9.75V4.5"
			/>
		</Svg>
	);
};
