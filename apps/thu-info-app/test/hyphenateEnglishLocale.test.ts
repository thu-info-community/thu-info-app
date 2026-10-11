import {expect, jest, test} from "@jest/globals";

// The locale is resolved once, when `i18n` is first imported, so this lives in
// its own file with an English store rather than toggling it mid-suite.
jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "en", darkMode: false}}),
	store: {dispatch: jest.fn()},
	persistor: {flush: jest.fn()},
}));

import {hyphenateLatinWords, SOFT_HYPHEN} from "../src/utils/hyphenate";
import {getStr} from "../src/utils/i18n";
import en from "../src/assets/translations/en";

test("getStr hyphenates English labels in the English locale", () => {
	const dorm = getStr("dorm");
	expect(dorm).toBe(hyphenateLatinWords(en.dorm));
	expect(dorm).not.toBe(en.dorm);
	expect(dorm.split(SOFT_HYPHEN).join("")).toBe(en.dorm);
});

test("getStr leaves a value containing a domain alone", () => {
	expect(getStr("configureDorm")).toBe(en.configureDorm);
});
