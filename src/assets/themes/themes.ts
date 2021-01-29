import {colorLight} from "../colors/light";
import {colorDark} from "../colors/dark";

export interface ColorTheme {
	primaryLight: string;
	primary: string;
	primaryDark: string;
	accent: string;
	text: string;
	background: string;
}

export interface Theme {
	colors: ColorTheme;
}

export default {
	light: {colors: colorLight},
	dark: {colors: colorDark},
	"no-preference": {colors: colorLight},
};
