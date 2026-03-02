import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={4}
				stroke={colors.themePurple}
				d="M6 24.0083V42H42V24"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={4}
				stroke={colors.themePurple}
				d="M33 15L24 6L15 15"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={4}
				stroke={colors.themePurple}
				d="M23.9917 32V6"
			/>
		</Svg>
	);
};

