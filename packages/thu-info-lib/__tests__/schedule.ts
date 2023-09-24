import {expect, it} from "@jest/globals";
import {ScheduleTime, scheduleTimeAdd} from "../src/models/schedule/schedule";

it("Test schedule time add", () => {
    const base: ScheduleTime = {base: [{
        dayOfWeek: 1,
        begin: 1,
        end: 3,
        activeWeeks: [1, 2, 3]
    }]};
    scheduleTimeAdd(base, {
        dayOfWeek: 3,
        begin: 1,
        end: 3,
        activeWeeks: [1, 2, 3]
    });
    console.log(base);
    expect(base.base.length).toEqual(2);
});