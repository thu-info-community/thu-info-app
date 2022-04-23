import {getLocales} from "react-native-localize";
import en from "../assets/translations/en";
import zh from "../assets/translations/zh";

export const getLocale = () => {
	const preferredLocales = getLocales();
	return preferredLocales[0].languageTag.startsWith("zh") ? zh : en;
};

const translations = getLocale() as typeof zh;

export function getStr<K extends keyof typeof zh>(key: K): string {
	// @ts-ignore
	return translations[key];
}
