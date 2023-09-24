import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M4 24C4 35.0457 10.6667 44 24 44C37.3333 44 44 35.0457 44 24H4Z"
				fill="none"
				stroke={colors.text}
				strokeWidth={3}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M16 24V8"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M24 24V6"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M32 24V4"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M8 24V10"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4 13L44 4"
			/>
		</Svg>
	);
};
