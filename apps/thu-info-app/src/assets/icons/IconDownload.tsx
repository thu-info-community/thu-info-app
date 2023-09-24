import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				stroke={theme.colors.themePurple}
				d="M6 24.008V42h36V24"
			/>
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				stroke={theme.colors.themePurple}
				d="m33 23-9 9-9-9M23.992 6v26"
			/>
		</Svg>
	);
};
