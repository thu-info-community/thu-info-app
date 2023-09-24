import Svg, {Path} from "react-native-svg";

export default ({
	width,
	height,
	color,
}: {
	width: number;
	height: number;
	color: string;
}) => {
	return (
		<Svg viewBox="0 0 6 4" width={width} height={height} fill="none">
			<Path
				strokeLinejoin="round"
				strokeWidth={0.625}
				fill={color}
				stroke={color}
				d="M5.5 0.958336L3 3.45834L0.5 0.958336H5.5Z"
			/>
		</Svg>
	);
};
