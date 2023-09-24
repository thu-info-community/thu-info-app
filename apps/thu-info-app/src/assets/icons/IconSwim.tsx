import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeWidth={4}
				strokeMiterlimit={2}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M36 27V8C36 5.79 37.79 4 40 4H44"
			/>
			<Path
				strokeWidth={4}
				strokeMiterlimit={2}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M10 27V8C10 5.79 11.79 4 14 4H18"
			/>
			<Path
				strokeWidth={4}
				strokeMiterlimit={2}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M10 12H36"
			/>
			<Path
				strokeWidth={4}
				strokeMiterlimit={2}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M10 20H36"
			/>
			<Path
				strokeWidth={4}
				strokeMiterlimit={2}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4 34L6.5 35.3514C8.1 36.2162 9.9 36.2162 11.5 35.3514C13.1 34.4865 14.9 34.4865 16.5 35.3514C18.1 36.2162 19.9 36.2162 21.5 35.3514C23.1 34.4865 24.9 34.4865 26.5 35.3514C28.1 36.2162 29.9 36.2162 31.5 35.3514C33.1 34.4865 34.9 34.4865 36.5 35.3514C38.1 36.2162 39.9 36.2162 41.5 35.3514L44 34"
			/>
			<Path
				strokeWidth={4}
				strokeMiterlimit={2}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4 40L6.5 41.3514C8.1 42.2162 9.9 42.2162 11.5 41.3514C13.1 40.4865 14.9 40.4865 16.5 41.3514C18.1 42.2162 19.9 42.2162 21.5 41.3514C23.1 40.4865 24.9 40.4865 26.5 41.3514C28.1 42.2162 29.9 42.2162 31.5 41.3514C33.1 40.4865 34.9 40.4865 36.5 41.3514C38.1 42.2162 39.9 42.2162 41.5 41.3514L44 40"
			/>
		</Svg>
	);
};
