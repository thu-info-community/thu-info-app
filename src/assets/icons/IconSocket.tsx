import {useColorScheme} from "react-native";
import themes from "../themes/themes";
import Svg, {Path} from "react-native-svg";

export default ({size, color}: {size: number; color: string}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 24 24" width={size} height={size}>
			<Path
				fillOpacity=".01"
				fill={theme.colors.contentBackground}
				d="M24 0H0V24H24V0Z"
			/>
			<Path d="M9 18v24h30V18L24 6 9 18Z" />
			<Path
				strokeLinejoin="round"
				strokeWidth={1.5}
				stroke={color}
				d="M12 22C17.5229 22 22 17.5229 22 12C22 6.47715 17.5229 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5229 6.47715 22 12 22Z"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				stroke={color}
				d="M7.5 13L8.5 16"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				stroke={color}
				d="M16.5 13L15.5 16"
			/>
			<Path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				stroke={color}
				d="M12 6.5V9.5"
			/>
		</Svg>
	);
};
