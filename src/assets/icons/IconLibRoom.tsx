import Svg, {Path} from "react-native-svg";
import React from "react";
import {svgGenerator} from "../../utils/svgGenerator";

export default svgGenerator((width, height, colors) => (
	<Svg viewBox="0 0 1024 1024" width={width} height={height}>
		<Path
			d="M827.8 959.7H196.2V64.3h631.6v895.4z m-589.7-41.9h547.7V106.2H238.1v811.6z"
			fill={colors.dark}
		/>
		<Path
			d="M147.1 916.5h729.8v41.9H147.1zM639.1 437.7c31.3 0 56.6 25.3 56.6 56.6s-25.3 56.6-56.6 56.6-56.6-25.3-56.6-56.6 25.3-56.6 56.6-56.6m0-42c-54.3 0-98.5 44.2-98.5 98.5s44.2 98.5 98.5 98.5 98.5-44.2 98.5-98.5-44.2-98.5-98.5-98.5z"
			fill={colors.green}
		/>
		<Path d="M618.1 571.9H660v81.8h-41.9z" fill={colors.green} />
	</Svg>
));
