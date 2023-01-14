import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({size, active}: {size: number; active: boolean}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const color = active ? theme.colors.mainTheme : "#0000";
	return (
		<Svg viewBox="0 0 48 48" width={size} height={size} fill="none">
			<Path fillOpacity=".01" fill="white" d="M0 0h48v48H0z" />
			<Path
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={color}
				d="M18.284 43.171a19.995 19.995 0 0 1-8.696-5.304 6 6 0 0 0-5.182-9.838A20.09 20.09 0 0 1 4 24c0-2.09.32-4.106.916-6H5a6 6 0 0 0 5.385-8.65 19.968 19.968 0 0 1 8.267-4.627A6 6 0 0 0 24 8a6 6 0 0 0 5.348-3.277 19.968 19.968 0 0 1 8.267 4.627A6 6 0 0 0 43.084 18c.595 1.894.916 3.91.916 6 0 1.38-.14 2.728-.406 4.029a6 6 0 0 0-5.182 9.838 19.995 19.995 0 0 1-8.696 5.304 6.003 6.003 0 0 0-11.432 0Z"
			/>
			<Path
				strokeLinejoin="round"
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={color}
				d="M24 31a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
			/>
		</Svg>
	);
};
