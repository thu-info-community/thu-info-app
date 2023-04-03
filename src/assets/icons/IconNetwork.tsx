import Svg, {Path} from "react-native-svg";
import themes from "../themes/themes";
import {useColorScheme} from "react-native";

export default ({width, height}: {width?: number; height?: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 751 751" width={width} height={height} fill="none">
			<Path
				d="m384,.03c3.02,0,6.02.14,8.99.39,199.24,9.17,357.94,173.59,357.94,375.07s-158.72,365.91-357.94,375.06c-2.97.27-5.97.41-8.99.41l-2.63-.05c-1.98.05-3.93.05-5.91.05C168.1,750.96,0,582.86,0,375.49S168.1.03,375.46.03l6.13.03,2.41-.03Zm119.35,77.4"
				fill={theme.colors.fontB1}
			/>
			<Path
				d="m580.06,392.56h119.23c-6.56,126.31-85.38,233.51-195.93,281,44.57-65.4,74.02-166.52,76.7-281Z"
				fill={theme.colors.mainTheme}
			/>
			<Path
				d="m528.84,392.56v.02c-3.87,152.83-59.25,273.63-119.24,301.24v-301.26h119.24Z"
				fill={theme.colors.mainTheme}
			/>
			<Path
				d="m358.4,392.56v301.26c-59.99-27.59-115.37-148.39-119.24-301.26h119.24Z"
				fill={theme.colors.mainTheme}
			/>
			<Path
				d="m271.05,68.39c-45.82,61.81-77.21,160.21-82.51,272.99H52.98c13.32-127.45,100.48-232.93,218.07-272.99Z"
				fill={theme.colors.mainTheme}
			/>
			<Path
				d="m187.94,392.58c2.8,119.87,34.99,225.11,83.11,289.99-122.72-41.69-212.41-154.93-219.41-290.01h136.3v.02Z"
				fill={theme.colors.mainTheme}
			/>
			<Path
				d="m697.94,341.36h-118.49c-5-106.17-33.11-199.61-74.63-261.75l-1.47-2.18c105.54,45.34,182.17,145.08,194.59,263.93Z"
				fill={theme.colors.mainTheme}
			/>
			<Path
				d="m528.21,341.36h-118.61V57.17c57.74,26.57,111.2,139.48,118.61,284.19Z"
				fill={theme.colors.mainTheme}
			/>
			<Path
				d="m358.4,57.17v284.19h-118.62c7.4-144.72,60.88-257.64,118.62-284.19Z"
				fill={theme.colors.mainTheme}
			/>
		</Svg>
	);
};
