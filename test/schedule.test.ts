import {parseSecondaryWeek} from "../src/helper/src/models/schedule/schedule";

test("Test parsing of secondary lessons session weeks.", () => {
	const callback = (_: number) => {};

	const check = (fn: jest.Mock<void, [number]>, target: number[]) => {
		expect(new Set(fn.mock.calls.map(([x]) => x))).toEqual(new Set(target));
	};

	const fn1 = jest.fn(callback);
	expect(parseSecondaryWeek("5", fn1)).toBe(true);
	check(fn1, [5]);

	const fn2 = jest.fn(callback);
	expect(parseSecondaryWeek("6,8,10,12,14", fn2)).toBe(true);
	check(fn2, [6, 8, 10, 12, 14]);

	const fn3 = jest.fn(callback);
	expect(parseSecondaryWeek("8-9,11-12", fn3)).toBe(true);
	check(fn3, [8, 9, 11, 12]);

	const fn4 = jest.fn(callback);
	expect(parseSecondaryWeek("3,6,9-10,14-15", fn4)).toBe(true);
	check(fn4, [3, 6, 9, 10, 14, 15]);

	const fn5 = jest.fn(callback);
	expect(parseSecondaryWeek("2-16", fn5)).toBe(true);
	check(fn5, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

	const fn6 = jest.fn(callback);
	expect(parseSecondaryWeek("16-14", fn6)).toBe(false);
});
