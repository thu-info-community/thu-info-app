import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeWidth={3}
				stroke={colors.text}
				fill="none"
				d="M24 38C33.3888 38 41 30.9411 41 21H7C7 30.9411 14.6112 38 24 38Z"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				d="M30 21C30 15.4772 25.7467 11 20.5 11C15.2533 11 11 15.4772 11 21"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				d="M39 21C39 17.6863 36.234 15 32.822 15C31.379 15 30.0515 15.4805 29 16.2857"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				d="M33 15L36 5"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				d="M38.0002 18.0001L42.0002 11.0001"
			/>
			<Path
				strokeWidth={3}
				stroke={colors.text}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M18 37L16 43H32L30 37"
			/>
		</Svg>
	);
};
