import Svg, {Path} from "react-native-svg";
import React from "react";
import {svgGenerator} from "../../utils/svgGenerator";
import {useColorScheme} from "react-native";
import themes from "../themes/themes";

export default svgGenerator((width, height) => {
	const themeName = useColorScheme();
	// eslint-disable-next-line  @typescript-eslint/no-unused-vars
	const {colors} = themes(themeName); //TODO
	return (
		<Svg width={width} height={height} viewBox="0 0 18 18" fill="none">
			<Path d="M18 0H0V18H18V0Z" fill="white" fillOpacity="0.01" />
			<Path
				d="M15.5625 3.75H13.3125"
				stroke="#333333"
				strokeWidth="1.125"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M10.3125 2.25V5.25"
				stroke="#333333"
				strokeWidth="1.125"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M10.3125 3.75H2.0625"
				stroke="#333333"
				strokeWidth="1.125"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M5.0625 9H2.0625"
				stroke="#333333"
				strokeWidth="1.125"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M8.0625 7.5V10.5"
				stroke="#333333"
				strokeWidth="1.125"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M16.3125 9H8.0625"
				stroke="#333333"
				strokeWidth="1.125"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M15.5625 14.25H13.3125"
				stroke="#333333"
				strokeWidth="1.125"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M10.3125 12.75V15.75"
				stroke="#333333"
				strokeWidth="1.125"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M10.3125 14.25H2.0625"
				stroke="#333333"
				strokeWidth="1.125"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
});
