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
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 1024 1024" width={width} height={height} fill="none">
			<Path
				fill={color ?? colors.fontB1}
				d="M874.666667 426.666667h-213.333334a21.333333 21.333333 0 0 1-21.333333-21.333334v-12.373333a20.906667 20.906667 0 0 1 6.4-15.36l75.946667-75.946667A295.68 295.68 0 0 0 512 213.333333a298.666667 298.666667 0 1 0 298.666667 318.72 21.333333 21.333333 0 0 1 21.333333-20.053333h42.666667a22.186667 22.186667 0 0 1 15.36 6.826667 21.333333 21.333333 0 0 1 5.546666 15.786666 384 384 0 1 1-111.786666-293.973333l63.573333-63.573333a20.906667 20.906667 0 0 1 14.933333-6.4h12.373334a21.333333 21.333333 0 0 1 21.333333 21.333333v213.333333a21.333333 21.333333 0 0 1-21.333333 21.333334z"
			/>
		</Svg>
	);
};
