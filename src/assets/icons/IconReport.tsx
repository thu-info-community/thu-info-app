import Svg, {Path} from "react-native-svg";
import React from "react";
import {svgGenerator} from "../../utils/svgGenerator";

export default svgGenerator((width, height, colors) => (
	<Svg viewBox="0 0 1024 1024" width={width} height={height}>
		<Path
			d="M877.2 63.45H146.8a25 25 0 0 0-25 25v847.1a25 25 0 0 0 25 25h730.4a25 25 0 0 0 25-25V88.45a25 25 0 0 0-25-25z m-25 847.1H171.8v-797.1h680.4z"
			fill={colors.dark}
		/>
		<Path
			d="M751.26,629.13L277.72,629.13a25,25 0,0 0,0 50h473.54a25,25 0,0 0,0 -50zM751.26,787.48L277.72,787.48a25,25 0,0 0,0 50h473.54a25,25 0,0 0,0 -50zM597,470.79a25,25 0,0 0,0 50h154.26a25,25 0,1 0,0 -50z"
			fill={colors.dark}
		/>
		<Path
			d="M261.15,552.42a25,25 0,0 0,32.64 -13.58l38.4,-93.15h120.44l41.73,93.78A25,25 0,1 0,540 519.15L412,231.54a25,25 0,0 0,-22.84 -14.84h-0.34a25,25 0,0 0,-22.77 15.47l-73.57,178.65 -0.18,0.45 -44.74,108.51a25,25 0,0 0,13.59 32.64zM390.15,305.17l40.27,90.52L352.8,395.69zM547.17,296.29h72.63v72.63a25,25 0,1 0,50 0v-72.63h72.64a25,25 0,0 0,0 -50L669.8,246.29v-72.63a25,25 0,1 0,-50 0v72.63h-72.63a25,25 0,1 0,0 50z"
			fill={colors.red}
		/>
	</Svg>
));
