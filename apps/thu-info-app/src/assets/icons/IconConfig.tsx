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
				strokeWidth={3}
				stroke={colors.fontB1}
				d="M41.5 10h-6M27.5 6v8M27.5 10h-22M13.5 24h-8M21.5 20v8M43.5 24h-22M41.5 38h-6M27.5 34v8M27.5 38h-22"
			/>
		</Svg>
	);
};
