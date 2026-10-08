import {expect, test} from "@jest/globals";
import {
	SCHEDULE_HEADER_MIN_FONT,
	scheduleHeaderFontSize,
	scheduleHeaderGlyphAdvanceEm,
} from "../src/utils/scheduleHeaderFont";

// A 320dp phone showing seven columns: (320 - 40 - 8) / 7.
const narrowUnitWidth = (320 - 40 - 8) / 7;
const DATE = "10/02";
const WEEKDAY_ZH = "周一";
const WEEKDAY_EN = "Mon";

test("a wide cell keeps the shipped size at any font scale", () => {
	expect(
		scheduleHeaderFontSize({
			unitWidth: 96,
			text: DATE,
			baseSize: 9,
			fontScale: 1,
		}),
	).toEqual({fontSize: 9, overflow: false});
	// A scale above 1 is what used to blow the cell open; it must not enlarge.
	expect(
		scheduleHeaderFontSize({
			unitWidth: 96,
			text: DATE,
			baseSize: 9,
			fontScale: 2,
		}),
	).toEqual({fontSize: 9, overflow: false});
	expect(
		scheduleHeaderFontSize({
			unitWidth: 96,
			text: WEEKDAY_ZH,
			baseSize: 12,
			fontScale: 3,
		}),
	).toEqual({fontSize: 12, overflow: false});
});

test("the reported case fits instead of clipping to 10/0", () => {
	const result = scheduleHeaderFontSize({
		unitWidth: narrowUnitWidth,
		text: DATE,
		baseSize: 9,
		fontScale: 2,
	});
	expect(result).toEqual({fontSize: 9, overflow: false});
	// The whole point: the fitted label is no wider than the cell's content box.
	expect(9 * scheduleHeaderGlyphAdvanceEm(DATE)).toBeLessThanOrEqual(
		narrowUnitWidth - 8,
	);
});

test("a narrower cell shrinks the label instead of clipping it", () => {
	expect(
		scheduleHeaderFontSize({
			unitWidth: 36,
			text: DATE,
			baseSize: 9,
			fontScale: 1,
		}),
	).toEqual({fontSize: 8, overflow: false});
	expect(
		scheduleHeaderFontSize({
			unitWidth: 30,
			text: WEEKDAY_EN,
			baseSize: 12,
			fontScale: 1,
		}),
	).toEqual({fontSize: 10.5, overflow: false});
});

test("the floor is reported rather than crossed", () => {
	expect(
		scheduleHeaderFontSize({
			unitWidth: 28,
			text: DATE,
			baseSize: 9,
			fontScale: 2,
		}),
	).toEqual({fontSize: SCHEDULE_HEADER_MIN_FONT, overflow: true});
	// A cell with no content box at all still yields a usable size.
	expect(
		scheduleHeaderFontSize({
			unitWidth: 10,
			text: DATE,
			baseSize: 9,
			fontScale: 1,
		}),
	).toEqual({fontSize: SCHEDULE_HEADER_MIN_FONT, overflow: true});
});

test("a two-glyph CJK weekday gets the same treatment", () => {
	expect(
		scheduleHeaderFontSize({
			unitWidth: narrowUnitWidth,
			text: WEEKDAY_ZH,
			baseSize: 12,
			fontScale: 2,
		}),
	).toEqual({fontSize: 12, overflow: false});
	expect(
		scheduleHeaderFontSize({
			unitWidth: 30,
			text: WEEKDAY_ZH,
			baseSize: 12,
			fontScale: 1,
		}),
	).toEqual({fontSize: 10, overflow: false});
});

test("the system's small-text setting is honoured, down to the floor", () => {
	// 0.85 is Android's smallest step, and lands between the floor and the cap.
	expect(
		scheduleHeaderFontSize({
			unitWidth: 96,
			text: DATE,
			baseSize: 9,
			fontScale: 0.85,
		}),
	).toEqual({fontSize: 7.5, overflow: false});
	// Below 0.78 the floor wins: a 4.5pt date would be unreadable.
	expect(
		scheduleHeaderFontSize({
			unitWidth: 96,
			text: DATE,
			baseSize: 9,
			fontScale: 0.5,
		}),
	).toEqual({fontSize: SCHEDULE_HEADER_MIN_FONT, overflow: false});
});

test("an unmeasured grid keeps the shipped size", () => {
	for (const unitWidth of [0, -5]) {
		expect(
			scheduleHeaderFontSize({unitWidth, text: DATE, baseSize: 9, fontScale: 2}),
		).toEqual({fontSize: 9, overflow: false});
		expect(
			scheduleHeaderFontSize({
				unitWidth,
				text: WEEKDAY_ZH,
				baseSize: 12,
				fontScale: 2,
			}),
		).toEqual({fontSize: 12, overflow: false});
	}
});

test("glyph advances stay on the conservative side of the real metrics", () => {
	expect(scheduleHeaderGlyphAdvanceEm(DATE)).toBeCloseTo(3.1, 5);
	expect(scheduleHeaderGlyphAdvanceEm(WEEKDAY_ZH)).toBeCloseTo(2, 5);
	expect(scheduleHeaderGlyphAdvanceEm(WEEKDAY_EN)).toBeCloseTo(1.86, 5);
});

test("across cell widths and font scales the label never exceeds the cap or the cell", () => {
	const cases: [string, number][] = [
		[DATE, 9],
		[WEEKDAY_ZH, 12],
	];
	for (const [text, baseSize] of cases) {
		const advance = scheduleHeaderGlyphAdvanceEm(text);
		for (let unitWidth = 0; unitWidth <= 200; unitWidth += 0.5) {
			for (const fontScale of [0.85, 1, 1.5, 2, 3]) {
				const {fontSize} = scheduleHeaderFontSize({
					unitWidth,
					text,
					baseSize,
					fontScale,
				});
				expect(fontSize).toBeGreaterThanOrEqual(SCHEDULE_HEADER_MIN_FONT);
				expect(fontSize).toBeLessThanOrEqual(baseSize);
				// `unitWidth <= 0` is the unmeasured grid, which keeps the shipped
				// size on purpose; at the floor the fit guarantee is given up.
				if (unitWidth > 0 && fontSize > SCHEDULE_HEADER_MIN_FONT) {
					expect(fontSize * advance + 8).toBeLessThanOrEqual(unitWidth);
				}
			}
		}
	}
});
