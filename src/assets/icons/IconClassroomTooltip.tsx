import Svg, {Path} from "react-native-svg";
import React from "react";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<Svg
			viewBox="0 0 26 16"
			width={26}
			height={16}
			style={{width: 26, height: 16}}>
			<Path
				fill={colors.fontB1}
				d="M0 0H26V13.3333H19.5H16.25L13 16L9.75 13.3333H6.5H0V0Z"
			/>
		</Svg>
	);
};
