import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={colors.themePurple}
				d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={4}
				stroke={colors.themePurple}
				d="M31 18V19"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={4}
				stroke={colors.themePurple}
				d="M17 18V19"
			/>
		</Svg>
	);
};
