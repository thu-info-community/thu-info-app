import Svg, {Path, Rect} from "react-native-svg";
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
				d="M44 22C44 12.0589 35.0457 4 24 4C12.9543 4 4 12.0589 4 22H44Z"
				fill="none"
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Rect
				x={4}
				y={38}
				width={40}
				height={6}
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
				d="M4 28L9.45455 32L16.7273 28L24 32L31.2727 28L38.5455 32L44 28"
			/>
		</Svg>
	);
};
