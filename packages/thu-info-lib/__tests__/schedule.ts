import {ScheduleTime, TimeSlice} from "../src/models/schedule/schedule";

global.console = {
    ...global.console,
    log: jest.fn,
};

it("TimeSlice decays to Block when it has only 1 active week", () => {
    const slice: TimeSlice = new TimeSlice(1, 1, 2, [1]);
    expect(slice.isBlock).toEqual(true);
});

it("TimeSlice does not decay to Block when it has more than 1 active week", () => {
    const slice: TimeSlice = new TimeSlice(1, 1, 2, [1, 2]);
    expect(slice.isBlock).toEqual(false);
});

it("TimeSlice deep copy", () => {
    const slice: TimeSlice = new TimeSlice(1, 1, 2, [1, 2, 3, 4, 5]);
    const deepCopy: TimeSlice = slice.val;
    deepCopy.activeWeeks.push(6);
    expect(slice.activeWeeks.length).toEqual(5);

    const shallowCopy: TimeSlice = slice;
    shallowCopy.activeWeeks.push(6);
    expect(slice.activeWeeks.length).toEqual(6);
});

it("TimeSlice overlapped", () => {
    const a: TimeSlice = new TimeSlice(1, 1, 3, [1, 3, 4, 5]);
    const b: TimeSlice = new TimeSlice(1, 2, 4, [2, 5, 6, 13]);
    expect(a.overlappedWeeks(b)).toEqual([5]);
});

it("TimeSlice not overlapped", () => {
    const a: TimeSlice = new TimeSlice(1, 1, 3, [1, 3, 4, 8]);
    const b: TimeSlice = new TimeSlice(1, 2, 4, [2, 5, 6, 13]);
    expect(a.overlappedWeeks(b)).toEqual([]);
});

it("TimeSlice adjacent", () => {
    const a: TimeSlice = new TimeSlice(1, 1, 3, [1, 3, 4, 5]);
    const b: TimeSlice = new TimeSlice(1, 4, 7, [2, 5, 6, 13]);
    expect(a.adjacentWeeks(b)).toEqual([5]);
});

it("TimeSlice not adjacent", () => {
    const a: TimeSlice = new TimeSlice(1, 1, 3, [1, 3, 4, 8]);
    const b: TimeSlice = new TimeSlice(1, 4, 7, [2, 5, 6, 13]);
    expect(a.adjacentWeeks(b)).toEqual([]);
});

it("TimeSlice comp", () => {
    const a: TimeSlice = new TimeSlice(1, 1, 3, [1, 3, 4, 8]);
    const b: TimeSlice = new TimeSlice(1, 4, 7, [2, 5, 6, 13]);
    expect(a.comp(b)).toBeLessThan(0);
    expect(b.comp(b)).toEqual(0);
    expect(b.comp(a)).toBeGreaterThan(0);
});

it("ScheduleTime activeWeek", () => {
    const time: ScheduleTime = new ScheduleTime();
    time.add(new TimeSlice(1, 1, 1, [1, 2, 3, 4, 5, 6]));
    expect(time.activeWeek(1)).toBeTruthy();
    expect(time.activeWeek(10)).toBeFalsy();
});

it("ScheduleTime insert (1)", () => {
    const time: ScheduleTime = new ScheduleTime();
    time.add(new TimeSlice(1, 1, 1, [1, 2, 3, 4, 5, 6]));
    time.add(new TimeSlice(5, 2, 2, [1, 2, 3, 4, 5, 6]));
    const base: TimeSlice[] = time.val;
    expect(base.length).toEqual(2);
    expect(base[0].dayOfWeek).toEqual(1);
    expect(base[0].begin).toEqual(1);
    expect(base[0].end).toEqual(1);
    expect(base[0].activeWeeks).toEqual([1, 2, 3, 4, 5, 6]);
    expect(base[1].dayOfWeek).toEqual(5);
    expect(base[1].begin).toEqual(2);
    expect(base[1].end).toEqual(2);
    expect(base[1].activeWeeks).toEqual([1, 2, 3, 4, 5, 6]);
});

it("ScheduleTime insert (2)", () => {
    const time: ScheduleTime = new ScheduleTime();
    time.add(new TimeSlice(1, 1, 1, [1, 2, 3, 4, 5, 6]));
    time.add(new TimeSlice(1, 2, 2, [1, 2, 3, 4, 5, 6]));
    const base: TimeSlice[] = time.val;
    expect(base.length).toEqual(1);
    expect(base[0].dayOfWeek).toEqual(1);
    expect(base[0].begin).toEqual(1);
    expect(base[0].end).toEqual(2);
    expect(base[0].activeWeeks).toEqual([1, 2, 3, 4, 5, 6]);
});

it("ScheduleTime insert (3)", () => {
    const time: ScheduleTime = new ScheduleTime();
    time.add(new TimeSlice(1, 1, 1, [1, 2, 3, 4, 5, 6]));
    time.add(new TimeSlice(1, 2, 3, [1, 2, 4, 7, 6]));
    const base: TimeSlice[] = time.val;
    expect(base.length).toEqual(3);
    expect(base[0].dayOfWeek).toEqual(1);
    expect(base[0].begin).toEqual(1);
    expect(base[0].end).toEqual(1);
    expect(base[0].activeWeeks).toEqual([3, 5]);
    expect(base[1].dayOfWeek).toEqual(1);
    expect(base[1].begin).toEqual(1);
    expect(base[1].end).toEqual(3);
    expect(base[1].activeWeeks).toEqual([1, 2, 4, 6]);
    expect(base[2].dayOfWeek).toEqual(1);
    expect(base[2].begin).toEqual(2);
    expect(base[2].end).toEqual(3);
    expect(base[2].activeWeeks).toEqual([7]);
});

it("ScheduleTime insert (4)", () => {
    const time: ScheduleTime = new ScheduleTime();
    time.add(new TimeSlice(1, 1, 1, [1, 2, 3, 4, 5, 6]));
    time.add(new TimeSlice(1, 4, 5, [1, 2, 3, 4, 5, 6]));
    let base: TimeSlice[] = time.val;
    expect(base.length).toEqual(2);
    expect(base[0].dayOfWeek).toEqual(1);
    expect(base[0].begin).toEqual(1);
    expect(base[0].end).toEqual(1);
    expect(base[0].activeWeeks).toEqual([1, 2, 3, 4, 5, 6]);
    expect(base[1].dayOfWeek).toEqual(1);
    expect(base[1].begin).toEqual(4);
    expect(base[1].end).toEqual(5);
    expect(base[1].activeWeeks).toEqual([1, 2, 3, 4, 5, 6]);

    time.add(new TimeSlice(1, 2, 3, [1, 2, 4, 5, 6]));
    base = time.val;
    expect(base.length).toEqual(3);
    expect(base[0].dayOfWeek).toEqual(1);
    expect(base[0].begin).toEqual(1);
    expect(base[0].end).toEqual(1);
    expect(base[0].activeWeeks).toEqual([3]);
    expect(base[1].dayOfWeek).toEqual(1);
    expect(base[1].begin).toEqual(1);
    expect(base[1].end).toEqual(5);
    expect(base[1].activeWeeks).toEqual([1, 2, 4, 5, 6]);
    expect(base[2].dayOfWeek).toEqual(1);
    expect(base[2].begin).toEqual(4);
    expect(base[2].end).toEqual(5);
    expect(base[2].activeWeeks).toEqual([3]);
});

it("ScheduleTime insert (5)", () => {
    const time: ScheduleTime = new ScheduleTime();
    time.add(new TimeSlice(1, 1, 2, [1, 3, 5]));
    time.add(new TimeSlice(1, 3, 5, [1, 3, 5]));
    time.add(new TimeSlice(1, 1, 3, [2, 4, 6]));
    let base: TimeSlice[] = time.val;
    expect(base.length).toEqual(2);
    expect(base[0].dayOfWeek).toEqual(1);
    expect(base[0].begin).toEqual(1);
    expect(base[0].end).toEqual(3);
    expect(base[0].activeWeeks).toEqual([2, 4, 6]);
    expect(base[1].dayOfWeek).toEqual(1);
    expect(base[1].begin).toEqual(1);
    expect(base[1].end).toEqual(5);
    expect(base[1].activeWeeks).toEqual([1, 3, 5]);

    time.add(new TimeSlice(1, 4, 5, [2, 4, 6]));
    base = time.val;
    expect(base.length).toEqual(1);
    expect(base[0].dayOfWeek).toEqual(1);
    expect(base[0].begin).toEqual(1);
    expect(base[0].end).toEqual(5);
    expect(base[0].activeWeeks).toEqual([1, 2, 3, 4, 5, 6]);
});