import {expect, test} from "@jest/globals";
import {
	LARGE_TEXT_MIN_SCALE,
	MAX_LAYOUT_SCALE,
	XLARGE_TEXT_MIN_SCALE,
	fontTierOf,
	isLargeText,
	isVeryLargeText,
	layoutScale,
} from "../src/utils/fontScale";

test("tiers track the system scale bands", () => {
	expect(fontTierOf(1)).toBe("normal");
	expect(fontTierOf(1.29)).toBe("normal");
	expect(fontTierOf(LARGE_TEXT_MIN_SCALE)).toBe("large");
	expect(fontTierOf(1.69)).toBe("large");
	expect(fontTierOf(XLARGE_TEXT_MIN_SCALE)).toBe("xlarge");
	expect(fontTierOf(2)).toBe("xlarge");
	expect(isLargeText(1)).toBe(false);
	expect(isLargeText(LARGE_TEXT_MIN_SCALE)).toBe(true);
	expect(isVeryLargeText(LARGE_TEXT_MIN_SCALE)).toBe(false);
	expect(isVeryLargeText(XLARGE_TEXT_MIN_SCALE)).toBe(true);
});

test("geometry grows with the font but never shrinks below its base", () => {
	expect(layoutScale(1)).toBe(1);
	expect(layoutScale(2)).toBe(2);
	// A "small text" setting is honoured by the font, not by shrinking boxes.
	expect(layoutScale(0.85)).toBe(1);
	expect(layoutScale(0.5)).toBe(1);
});

test("geometry is capped, and a non-finite scale degrades to no scaling", () => {
	expect(layoutScale(3)).toBe(MAX_LAYOUT_SCALE);
	expect(layoutScale(5, 4)).toBe(4);
	// A `max` below the base is clamped up to the base, so geometry never shrinks.
	expect(layoutScale(0.5, 0.5)).toBe(1);
	expect(layoutScale(Number.NaN)).toBe(1);
	expect(layoutScale(Number.POSITIVE_INFINITY)).toBe(1);
});
