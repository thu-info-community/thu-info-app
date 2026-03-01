import {colorLight} from "../colors/light";
import {colorDark} from "../colors/dark";
import {currState} from "../../redux/store";
import {enableEasterEgg} from "../../utils/easterEgg";
import {colorPkuDark} from "../colors/pkuDark";
import {colorPkuLight} from "../colors/pkuLight";

export interface ColorTheme {
	primaryLight: string;
	primary: string;
	primaryDark: string;
	accent: string;
	text: string;
	contentBackground: string;
	themeBackground: string;
	inputBorder: string;
	transparent: string;

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
	themeDarkPurple: string;
	themeLightPurple: string;
	themeDarkGrey: string;
	themeGrey: string;
	themeLightGrey: string;
	themeTransparentGrey: string;
	themeGold: string;
	courseItemColorList: string[];

	/* --- 设计规范 Design Tokens (2026-03-01) --- */
	/** 主按钮背景（绿） */
	btnPrimaryBg: string;
	/** 主按钮文字（深色以提升对比度） */
	btnPrimaryText: string;
	/** 主色-紫 */
	primaryPurple: string;
	primaryPurpleLight: string;
	primaryPurpleDark: string;
	/** 主色-绿 */
	primaryGreen: string;
	primaryGreenLight: string;
	primaryGreenDark: string;
	/** 文字层级 */
	textPrimary: string;
	textSecondary: string;
	textInverse: string;
	/** 焦点环 */
	focusColor: string;
	focusWidth: number;
	focusOffset: number;
	/** 深色模式：背景 / 错误色 / 焦点内层遮罩、外环 */
	bgPrimary?: string;
	bgSecondary?: string;
	bgTertiary?: string;
	darkError?: string;
	focusInnerMask?: string;
	focusOuterRing?: string;
	/** 浅色模式：计划等内容的纸张色背景（纸张美学） */
	bgPaper?: string;
	/** Modal 外半透明遮罩（规范暖炭黑/深色+透明度，保证下层文字仍可辨读） */
	overlayBackdrop?: string;
}

export interface Theme {
	colors: ColorTheme;
}

export default (themeName: string | null | undefined): Theme => ({
	colors:
		currState().config.darkMode || themeName === "dark"
			? enableEasterEgg()
				? colorPkuDark
				: colorDark
			: enableEasterEgg()
			? colorPkuLight
			: colorLight,
});
