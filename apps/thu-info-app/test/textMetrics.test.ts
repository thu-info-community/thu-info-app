import {expect, test} from "@jest/globals";
import {minCellWidthForLabels, textGlyphAdvanceEm} from "../src/utils/textMetrics";

const DATE = "10/02";
const WEEKDAY_ZH = "周一";
const WEEKDAY_EN = "Mon";

test("glyph advances stay on the conservative side of the real metrics", () => {
	expect(textGlyphAdvanceEm(DATE)).toBeCloseTo(3.1, 5);
	expect(textGlyphAdvanceEm(WEEKDAY_ZH)).toBeCloseTo(2, 5);
	expect(textGlyphAdvanceEm(WEEKDAY_EN)).toBeCloseTo(1.86, 5);
});

test("the cell contains the widest label at the scaled size", () => {
	const width = minCellWidthForLabels({
		labels: [DATE, WEEKDAY_ZH],
		baseFontSize: 9,
		fontScale: 1,
		cellPadding: 4,
	});
	// The date is the widest label: 9 * 3.1 em + 2*4 padding + 2 safety.
	expect(9 * textGlyphAdvanceEm(DATE) + 8 + 2).toBeLessThanOrEqual(width);
	expect(width).toBe(38);
});

test("a large font scale widens the cell with the text", () => {
	const at1 = minCellWidthForLabels({
		labels: [DATE],
		baseFontSize: 9,
		fontScale: 1,
		cellPadding: 4,
	});
	const at2 = minCellWidthForLabels({
		labels: [DATE],
		baseFontSize: 9,
		fontScale: 2,
		cellPadding: 4,
	});
	expect(at2).toBeGreaterThan(at1);
	// The label rendered at 2x still fits inside the 2x cell: nothing is clipped.
	expect(9 * 2 * textGlyphAdvanceEm(DATE) + 8 + 2).toBeLessThanOrEqual(at2);
});

test("the width is that of the widest requested label", () => {
	const narrow = minCellWidthForLabels({
		labels: [WEEKDAY_EN],
		baseFontSize: 9,
		fontScale: 1,
	});
	const wide = minCellWidthForLabels({
		labels: [WEEKDAY_EN, DATE],
		baseFontSize: 9,
		fontScale: 1,
	});
	expect(wide).toBeGreaterThanOrEqual(narrow);
});

test("a soft hyphen takes no space, so a hyphenated label measures as its plain form", () => {
	const hyphenated = "Dor\u00ADmi\u00ADto\u00ADry";
	expect(textGlyphAdvanceEm(hyphenated)).toBeCloseTo(
		textGlyphAdvanceEm("Dormitory"),
		5,
	);
	expect(
		minCellWidthForLabels({labels: [hyphenated], baseFontSize: 9, fontScale: 1}),
	).toBe(
		minCellWidthForLabels({labels: ["Dormitory"], baseFontSize: 9, fontScale: 1}),
	);
});

test("a non-finite scale is treated as 1", () => {
	expect(
		minCellWidthForLabels({labels: [DATE], baseFontSize: 9, fontScale: Number.NaN}),
	).toBe(minCellWidthForLabels({labels: [DATE], baseFontSize: 9, fontScale: 1}));
});
