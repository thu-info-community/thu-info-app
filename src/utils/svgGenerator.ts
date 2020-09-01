import {ReactElement} from "react";

interface ColorBoard {
	dark: string;
	green: string;
	yellow: string;
	blue: string;
	golden: string;
	red: string;
}

export const svgGenerator = (
	transform: (
		width: number | string | undefined,
		height: number | string | undefined,
		colors: ColorBoard,
	) => ReactElement,
) => ({width, height}: {width?: number | string; height?: number | string}) =>
	transform(width, height, {
		dark: "#202020",
		green: "#008577",
		yellow: "#FF9800",
		blue: "#2196F3",
		golden: "#F1DA71",
		red: "#E53935",
	});
