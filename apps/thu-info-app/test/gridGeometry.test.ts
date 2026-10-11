import {expect, test} from "@jest/globals";
import {computeGridGeometry} from "../src/utils/gridGeometry";

test("at font scale 1 the fit mode reproduces the shipped geometry", () => {
	// A 320dp phone with a 48dp axis: (320 - 48) / 7 = 38.86dp, under the 96 cap.
	const geometry = computeGridGeometry({
		contentWidth: 320,
		dayCount: 7,
		maxUnitWidth: 96,
		minCellWidth: 30,
		gutterWidth: 48,
	});
	expect(geometry.mode).toBe("fit");
	expect(geometry.scrollable).toBe(false);
	expect(geometry.unitWidth).toBeCloseTo((320 - 48) / 7, 6);
	expect(geometry.gridWidth).toBeCloseTo(320 - 48, 6);
});

test("a wide screen caps the column instead of stretching it", () => {
	const geometry = computeGridGeometry({
		contentWidth: 1280,
		dayCount: 7,
		maxUnitWidth: 96,
		minCellWidth: 30,
		gutterWidth: 48,
	});
	expect(geometry.unitWidth).toBe(96);
	expect(geometry.gridWidth).toBe(96 * 7);
});

test("a large font pushes the grid into overflow at the minimum cell width", () => {
	const geometry = computeGridGeometry({
		contentWidth: 320,
		dayCount: 7,
		maxUnitWidth: 96,
		minCellWidth: 64,
		gutterWidth: 48,
	});
	expect(geometry.mode).toBe("overflow");
	expect(geometry.scrollable).toBe(true);
	expect(geometry.unitWidth).toBe(64);
	expect(geometry.gridWidth).toBe(64 * 7);
});

test("a degenerate day count still returns a usable geometry", () => {
	const geometry = computeGridGeometry({
		contentWidth: 320,
		dayCount: 0,
		maxUnitWidth: 96,
		minCellWidth: 0,
		gutterWidth: 48,
	});
	expect(geometry.mode).toBe("fit");
	expect(geometry.scrollable).toBe(false);
	expect(geometry.unitWidth).toBe(96);
});
