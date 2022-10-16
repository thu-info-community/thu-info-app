import Svg, {Circle, Path, Rect} from "react-native-svg";
import themes from "../themes/themes";
import {useColorScheme} from "react-native";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 40 40" width={width} height={height}>
			<Rect width={40} height={40} fill="#A652CB" />
			<Circle cx={20} cy={20} r={16.6667} fill="#A652CB" />
			<Path
				opacity={0.797947}
				d="M11.207 11.6616C11.207 11.6616 15.5389 13.9139 17.424 16.0243C18.3729 17.0865 19.0962 18.2537 19.0962 19.716C19.0962 21.1784 19.0962 22.2999 19.0962 22.2999"
				stroke={theme.colors.themeBackground}
				strokeWidth={2.83688}
				strokeLinecap="round"
			/>
			<Path
				opacity={0.797947}
				d="M28.7422 11.6616C28.7422 11.6616 24.4103 13.9139 22.5252 16.0243C21.5763 17.0865 20.853 18.2537 20.853 19.716C20.853 21.1784 20.853 22.2999 20.853 22.2999"
				stroke={theme.colors.themeBackground}
				strokeWidth={2.83688}
				strokeLinecap="round"
			/>
			<Path
				d="M20.0006 8.40359V25.7086"
				stroke={theme.colors.themeBackground}
				strokeWidth={4.68085}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M15.2402 24.9014L19.859 31.4186L24.6553 24.9014"
				stroke={theme.colors.themeBackground}
				strokeWidth={4.11347}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};
