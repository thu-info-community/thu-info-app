import {colorLight} from "../colors/light";

export interface ColorTheme {
	primaryLight: string;
	primary: string;
	primaryDark: string;
	accent: string;
}

export interface Theme {
	colors: ColorTheme;
}

export default {
	light: {colors: colorLight},
	dark: {colors: colorLight},
	"no-preference": {colors: colorLight},
};
