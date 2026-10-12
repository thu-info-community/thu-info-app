import {expect, test} from "@jest/globals";
import {safeFontScale, scaledLineHeight} from "../src/utils/scaledText";

test("a line box grows with the glyphs", () => {
	expect(scaledLineHeight(20, 1)).toBe(20);
	expect(scaledLineHeight(20, 2)).toBe(40);
	expect(scaledLineHeight(18, 1.5)).toBe(27);
});

test("a small-text setting shrinks the box with the font", () => {
	expect(scaledLineHeight(20, 0.85)).toBe(17);
});

test("a non-finite or zero scale degrades to no scaling", () => {
	expect(safeFontScale(Number.NaN)).toBe(1);
	expect(safeFontScale(0)).toBe(1);
	expect(safeFontScale(-2)).toBe(1);
	expect(scaledLineHeight(20, Number.NaN)).toBe(20);
});
