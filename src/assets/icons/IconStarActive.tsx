import Svg, {Path} from "react-native-svg";

export default ({width, height}: {width: number; height: number}) => {
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeWidth={2}
				strokeLinejoin="round"
				stroke={"#ffcc00"}
				d="m23.999 5-6.113 12.478L4 19.49l10.059 9.834L11.654 43 24 36.42 36.345 43 33.96 29.325 44 19.491l-13.809-2.013L24 5Z"
				fill={"#ffcc00"}
			/>
		</Svg>
	);
};
