import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				fill={theme.colors.fontB1}
				d="M38.683 41.642V6.39a2.002 2.002 0 0 0-1.996-2h-6.035V4a2.002 2.002 0 0 0-1.996-2H8.804a1.994 1.994 0 0 0-1.996 2v37.642H3.717A1.674 1.674 0 0 0 2 43.322a1.682 1.682 0 0 0 1.063 1.563c.208.082.43.121.654.115h24.94a1.994 1.994 0 0 0 1.996-2V7.584h4.768v35.416a2.002 2.002 0 0 0 1.996 2h5.866a1.673 1.673 0 0 0 1.585-1.026 1.682 1.682 0 0 0-.93-2.215 1.675 1.675 0 0 0-.655-.116h-4.599Zm-14.796-1.42H13.574a1.995 1.995 0 0 1-1.996-2V8.778a2.002 2.002 0 0 1 1.996-2h10.313a1.994 1.994 0 0 1 1.997 2V38.22a2.002 2.002 0 0 1-1.997 2v.002ZM21.113 21.11a2.381 2.381 0 0 1 2.204 1.474 2.394 2.394 0 0 1-1.291 3.122 2.381 2.381 0 0 1-2.599-.518 2.391 2.391 0 0 1 1.686-4.078Z"
			/>
			<Path
				clipRule="evenodd"
				fillRule="evenodd"
				fill={theme.colors.mainTheme}
				d="M24.885 42.222H12.908a1.994 1.994 0 0 1-1.996-2v-33a2.002 2.002 0 0 1 1.996-2h11.977a1.994 1.994 0 0 1 1.997 2v33a1.995 1.995 0 0 1-1.996 2Z"
			/>
			<Path
				clipRule="evenodd"
				fillRule="evenodd"
				fill={theme.colors.fontB1}
				d="M23.11 21.11a2.38 2.38 0 0 1 2.204 1.476 2.393 2.393 0 0 1-1.29 3.12 2.38 2.38 0 0 1-2.6-.517 2.391 2.391 0 0 1 1.687-4.078Z"
			/>
		</Svg>
	);
};
