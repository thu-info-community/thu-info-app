import Svg, {Path} from "react-native-svg";
import React from "react";

export default ({size, color}: {size: number; color: string}) => {
	return (
		<Svg viewBox="0 0 48 48" width={size} height={size}>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={color}
				d="M44 7H4v30h7v5l10-5h23V7ZM31 16v1M17 16v1"
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={color}
				d="M31 25s-2 4-7 4-7-4-7-4"
			/>
		</Svg>
	);
};
