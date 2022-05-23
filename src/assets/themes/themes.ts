import {colorLight} from "../colors/light";
import {colorDark} from "../colors/dark";

export interface ColorTheme {
	primaryLight: string;
	primary: string;
	primaryDark: string;
	accent: string;
	text: string;
	contentBackground: string;
	themeBackground: string;

	mainTheme: string;
	fontB0: string;
	fontB1: string;
	fontB2: string;
	fontB3: string;
	statusNormal: string;
	statusDisabled: {rgb: string; alpha: number};
	statusWarning: string;
}

export interface Theme {
	colors: ColorTheme;
}

export default (themeName: string | null | undefined): Theme => ({
	colors: themeName === "dark" ? colorDark : colorLight,
});
