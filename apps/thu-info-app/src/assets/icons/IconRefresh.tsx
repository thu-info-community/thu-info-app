import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({
	width,
	height,
	color,
}: {
	width: number;
	height: number;
	color?: string;
}) => {
	if (!color) {
		const themeName = useColorScheme();
		const {colors} = themes(themeName);
		color = colors.fontB1;
	}
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				stroke={color}
				d="M42 8v16M6 24v16M6 24c0 9.941 8.059 18 18 18a17.94 17.94 0 0 0 12.5-5.048M42 24c0-9.941-8.058-18-18-18a17.947 17.947 0 0 0-12.951 5.5"
			/>
		</Svg>
	);
};
