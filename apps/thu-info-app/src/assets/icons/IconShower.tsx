import Svg, {Path} from "react-native-svg";
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
				d="M27 20V22H9V20C9 16.6863 13.0294 14 18 14C22.9706 14 27 16.6863 27 20Z"
				fill="none"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M42 44V12.5C42 7.80558 36.6274 4 30 4C23.3726 4 18 7.80558 18 12.5V14"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M18 29L18 28"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M10.1711 28.0303L9.8291 28.97"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4.17112 43.0303L3.8291 43.97"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M18 44L18 43"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M18 37L18 35"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M7.34224 35.0603L6.6582 36.9397"
			/>
		</Svg>
	);
};
