import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 18 18" width={width} height={height}>
			<Path
				strokeWidth={1.5}
				strokeLinejoin="round"
				stroke={colors.themePurple}
				d="M7.875 14.25a6.375 6.375 0 1 0 0-12.75 6.375 6.375 0 0 0 0 12.75Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.125}
				stroke={colors.themePurple}
				d="m12.458 12.458 3.182 3.182"
			/>
		</Svg>
	);
};
