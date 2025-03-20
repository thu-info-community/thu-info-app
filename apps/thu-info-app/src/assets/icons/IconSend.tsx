import Svg, {Path} from "react-native-svg";

export default ({width, height, color}: {width: number; height: number; color: string}) => {
	return (
		<Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				stroke={color}
				d="M43 5L29.7 43L22.1 25.9L5 18.3L43 5Z"
			/>
			<Path
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				stroke={color}
				d="M43.0001 5L22.1001 25.9"
			/>
		</Svg>
	);
};
