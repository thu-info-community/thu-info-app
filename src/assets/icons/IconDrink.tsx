import Svg, {Line, Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Line
				x1={10}
				y1={16}
				x2={38}
				y2={16}
				stroke={colors.text}
				strokeWidth={3}
				strokeLinecap="round"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				d="M14.153 18.1425C14.0703 16.9848 14.9873 16 16.148 16H31.852C33.0127 16 33.9297 16.9848 33.847 18.1425L32.1327 42.1425C32.0579 43.1891 31.187 44 30.1378 44H17.8622C16.813 44 15.9421 43.1891 15.8673 42.1425L14.153 18.1425Z"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				d="M24 10V6C24 4.89543 24.8954 4 26 4H29"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				d="M14.7215 11.6712C14.8822 10.7068 15.7166 10 16.6943 10H31.3057C32.2834 10 33.1178 10.7068 33.2785 11.6712L34 16H14L14.7215 11.6712Z"
				fill="none"
			/>
		</Svg>
	);
};
