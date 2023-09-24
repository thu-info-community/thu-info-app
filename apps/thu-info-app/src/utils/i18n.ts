import {getLocales} from "react-native-localize";
import en from "../assets/translations/en";
import zh from "../assets/translations/zh";
import {currState} from "../redux/store";

export const getLocale = () => {
	const preferredLocales = getLocales();
	const languageSettings = currState().config.language;
	if (languageSettings === "zh") {
		return zh;
	} else if (languageSettings === "en") {
		return en;
	} else {
		return preferredLocales[0].languageTag.startsWith("zh") ? zh : en;
	}
};

const translations = getLocale() as typeof zh;

export function getStr<K extends keyof typeof zh>(key: K): string {
	// @ts-ignore
	return translations[key];
}
