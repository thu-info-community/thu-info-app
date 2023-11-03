import Svg, {Circle, Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeWidth={4}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M3 6H6.5L8 12M8 12L13 32H39L44 12H8Z"
			/>
			<Circle
				cx={13}
				cy={39}
				r={3}
				stroke={colors.text}
				strokeWidth={4}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Circle
				cx={39}
				cy={39}
				r={3}
				stroke={colors.text}
				strokeWidth={4}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};
