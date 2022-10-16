import Svg, {Path} from "react-native-svg";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default ({width, height}: {width: number; height: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height}>
			<Path fillOpacity=".01" fill="white" d="M0 0h48v48H0z" />
			<Path
				strokeWidth={3}
				stroke={theme.colors.fontB1}
				fill={theme.colors.mainTheme}
				d="M14 13.6c0-1.436-1.343-2.6-3-2.6s-3 1.164-3 2.6v20.8c0 1.436 1.343 2.6 3 2.6s3-1.164 3-2.6V13.6ZM40 13.6c0-1.436-1.343-2.6-3-2.6s-3 1.164-3 2.6v20.8c0 1.436 1.343 2.6 3 2.6s3-1.164 3-2.6V13.6ZM8 18.667C8 17.194 6.657 16 5 16s-3 1.194-3 2.667v10.666C2 30.806 3.343 32 5 32s3-1.194 3-2.667V18.667ZM46 18.667C46 17.194 44.657 16 43 16s-3 1.194-3 2.667v10.666C40 30.806 41.343 32 43 32s3-1.194 3-2.667V18.667ZM34 27H14v-6h20v6Z"
			/>
		</Svg>
	);
};
