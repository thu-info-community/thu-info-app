import {ReactElement} from "react";
import {useColorScheme} from "react-native";

interface ColorBoard {
	dark: string;
	green: string;
	yellow: string;
	blue: string;
	golden: string;
	red: string;
}

export const svgGenerator =
	(
		transform: (
			width: number | string | undefined,
			height: number | string | undefined,
			colors: ColorBoard,
		) => ReactElement,
	) =>
	({width, height}: {width?: number | string; height?: number | string}) => {
		const dark = useColorScheme() === "dark";
		return transform(width, height, {
			dark: dark ? "#A0A0A0" : "#202020",
			green: "#008577",
			yellow: "#FF9800",
			blue: "#2196F3",
			golden: "#F1DA71",
			red: "#E53935",
		});
	};
