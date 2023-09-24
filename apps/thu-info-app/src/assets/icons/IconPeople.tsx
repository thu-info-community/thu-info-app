import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 15 15" width={width} height={height} fill="none">
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M5.63673 5.93361C6.78364 5.93361 7.71339 5.00385 7.71339 3.85694C7.71339 2.71003 6.78364 1.78027 5.63673 1.78027C4.48981 1.78027 3.56006 2.71003 3.56006 3.85694C3.56006 5.00385 4.48981 5.93361 5.63673 5.93361Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M9.67358 2.07715C10.2766 2.44054 10.68 3.10175 10.68 3.85715C10.68 4.61255 10.2766 5.27376 9.67358 5.63715"
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M1.18665 12.104V12.46H10.0866V12.104C10.0866 10.7748 10.0866 10.1102 9.82798 9.60251C9.60044 9.15594 9.23735 8.79285 8.79078 8.5653C8.28309 8.30664 7.6185 8.30664 6.28931 8.30664H4.98398C3.65479 8.30664 2.9902 8.30664 2.48251 8.5653C2.03594 8.79285 1.67286 9.15594 1.44532 9.60251C1.18665 10.1102 1.18665 10.7748 1.18665 12.104Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.18667}
				stroke={colors.fontB2}
				d="M13.0533 12.4601V12.1041C13.0533 10.7749 13.0533 10.1103 12.7947 9.60264C12.5671 9.15606 12.204 8.79297 11.7574 8.56543"
			/>
		</Svg>
	);
};
