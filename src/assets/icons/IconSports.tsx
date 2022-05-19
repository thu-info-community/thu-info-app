import Svg, {Path} from "react-native-svg";
import React from "react";
import {svgGenerator} from "../../utils/svgGenerator";

export default svgGenerator((width, height, colors) => (
	<Svg viewBox="0 0 48 48" width={width} height={height}>
		<Path
			strokeLinejoin="round"
			strokeLinecap="square"
			strokeMiterlimit={2}
			strokeWidth={3}
			d="M17.818 4.98C7.309 8.39 1.57 19.678 4.98 30.176c3.41 10.498 14.697 16.247 25.195 12.838 10.509-3.41 16.247-14.698 12.838-25.196C39.603 7.309 28.316 1.57 17.818 4.98Z"
			stroke={colors.dark}
		/>
		<Path
			strokeLinejoin="round"
			strokeLinecap="square"
			strokeMiterlimit={2}
			strokeWidth={3}
			d="m34 21-10-8-10 8 4 12h12l4-12ZM34 21l9-3M36 40l-6-7M18 33l-6 7M14 21l-9-3M24 13V4"
			stroke={colors.dark}
		/>
	</Svg>
));
