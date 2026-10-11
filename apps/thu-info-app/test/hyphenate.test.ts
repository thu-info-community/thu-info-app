import {expect, jest, test} from "@jest/globals";

jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh", darkMode: false}}),
	store: {dispatch: jest.fn()},
	persistor: {flush: jest.fn()},
}));

import {hyphenateLatinWords, SOFT_HYPHEN} from "../src/utils/hyphenate";
import {getStr} from "../src/utils/i18n";
import zh from "../src/assets/translations/zh";

const strip = (text: string) => text.split(SOFT_HYPHEN).join("");

test("English words gain soft hyphens only at syllable points", () => {
	expect(hyphenateLatinWords("Dormitory")).toBe("Dor\u00ADmi\u00ADto\u00ADry");
	expect(strip(hyphenateLatinWords("Dormitory"))).toBe("Dormitory");
	expect(hyphenateLatinWords("Zijing Building")).toBe(
		"Zi\u00ADjing Build\u00ADing",
	);
});

test("a word with no break points, or one too short, is left alone", () => {
	expect(hyphenateLatinWords("Dorm")).toBe("Dorm");
	expect(hyphenateLatinWords("2023 - 2024")).toBe("2023 - 2024");
	expect(hyphenateLatinWords("")).toBe("");
});

test("Chinese text is untouched", () => {
	expect(hyphenateLatinWords("教务处")).toBe("教务处");
	expect(hyphenateLatinWords("第三教学楼")).toBe("第三教学楼");
});

test("URLs, e-mails and paths are not split", () => {
	expect(hyphenateLatinWords("myhome.tsinghua.edu.cn")).toBe(
		"myhome.tsinghua.edu.cn",
	);
	expect(hyphenateLatinWords("a@b.com")).toBe("a@b.com");
	expect(hyphenateLatinWords("https://www.example.com/dormitory")).toBe(
		"https://www.example.com/dormitory",
	);
});

test("hyphenation is idempotent", () => {
	const once = hyphenateLatinWords("Dormitory");
	expect(hyphenateLatinWords(once)).toBe(once);
});

test("getStr leaves the Chinese locale byte-identical", () => {
	expect(getStr("dorm")).toBe(zh.dorm);
	expect(getStr("scheduleDetail")).toBe(zh.scheduleDetail);
});

