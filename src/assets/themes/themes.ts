import {colorLight} from "../colors/light";
import {colorDark} from "../colors/dark";

export interface ColorTheme {
	primaryLight: string;
	primary: string;
	primaryDark: string;
	accent: string;
	text: string;
	background: string;
	background2: string;
}

export interface Theme {
	colors: ColorTheme;
}

export default (themeName: string | null | undefined): Theme => ({
	colors: themeName === "dark" ? colorDark : colorLight,
});
