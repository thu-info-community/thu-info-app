import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				strokeLinejoin="round"
				strokeWidth={2}
				stroke={colors.fontB1}
				d="M12 22C17.5229 22 22 17.5229 22 12C22 6.47715 17.5229 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5229 6.47715 22 12 22Z"
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				stroke={colors.fontB1}
				d="M8 12H16"
			/>
		</Svg>
	);
};
