import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({full}: {full: boolean}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 28 28" fill="none">
			<Path
				strokeWidth={1.4}
				strokeLinejoin="round"
				fill={full ? "#FFCC00" : undefined}
				stroke={full ? "#FFCC00" : colors.fontB3}
				d="M13.9992 2.91669L10.4333 10.1953L2.33337 11.3698L8.20107 17.1063L6.79844 25.0834L13.9992 21.2446L21.2015 25.0834L19.8092 17.1063L25.6667 11.3698L17.6116 10.1953L13.9992 2.91669Z"
			/>
		</Svg>
	);
};
