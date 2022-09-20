import {colorLight} from "../colors/light";

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
	statusWarningOpacity: string;
	statusError: string;
	themeGreen: string;
	themeBlue: string;
	themeTransparentPurple: string;
	themePurple: string;
	themeLightPurple: string;
	themeDarkGrey: string;
	themeGrey: string;
	themeLightGrey: string;
}

export interface Theme {
	colors: ColorTheme;
}

export default (_: string | null | undefined): Theme => ({
	colors: colorLight,
});
