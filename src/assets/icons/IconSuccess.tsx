import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 128 128" width={width} height={height}>
			<Path
				strokeWidth={5.33333}
				stroke={colors.contentBackground}
				fill="#30D158"
				d="M64 10.6667L78.0088 20.8855L95.3486 20.8525L100.676 37.3539L114.723 47.5193L109.333 64.0001L114.723 80.4809L100.676 90.6462L95.3486 107.148L78.0088 107.115L64 117.333L49.9912 107.115L32.6515 107.148L27.3246 90.6462L13.277 80.4809L18.6667 64.0001L13.277 47.5193L27.3246 37.3539L32.6515 20.8525L49.9912 20.8855L64 10.6667Z"
			/>
			<Path
				strokeWidth={5.33333}
				stroke={colors.contentBackground}
				d="M45.3333 64.0001L58.6666 77.3334L85.3333 50.6667"
			/>
		</Svg>
	);
};
