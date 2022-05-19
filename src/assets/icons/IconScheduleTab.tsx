import Svg, {Path, Rect} from "react-native-svg";
import React from "react";

export default ({size, color}: {size: number; color: string}) => {
	return (
		<Svg viewBox="0 0 48 48" width={size} height={size}>
			<Rect
				strokeLinecap="square"
				strokeWidth={3}
				stroke={color}
				rx={2}
				height={30}
				width={40}
				y={10}
				x={4}
			/>
			<Path
				strokeLinecap="square"
				strokeWidth={3}
				stroke={color}
				d="M14 6v8M25 23H14M34 31H14M34 6v8"
			/>
		</Svg>
	);
};
