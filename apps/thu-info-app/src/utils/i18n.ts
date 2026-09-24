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

export const langCode = translations === zh ? "zh" : "en";

export function getStr<K extends keyof typeof zh>(key: K): string {
	if (translations[key] === undefined) {
		console.warn(`Missing translation for key ${key}, language ${langCode}`);
		return key;
	}

	// @ts-ignore
	return translations[key];
}

/**
 * Whether a translation exists for `key`. Use this for keys that originate from
 * the server rather than from the bundle — news channels in particular, whose
 * `LM_BM_<dept>_<code>` ids are returned by the news API and gain new members
 * over time. `getStr` only echoes the raw key in that case, which is fine as a
 * last resort but not something to put in front of the user.
 */
export function hasStr(key: string): boolean {
	return (
		(translations as unknown as Record<string, string | undefined>)[key] !==
		undefined
	);
}
