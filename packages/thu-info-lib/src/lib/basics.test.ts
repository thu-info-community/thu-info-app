import dayjs from "dayjs";
import {__parseCalendarDataForTest as parseCalendarData} from "./basics";

const make = (kssj: string) => parseCalendarData({
    kssj,
    jssj: dayjs(kssj).add(120, "day").format("YYYY-MM-DD"),
    id: "x",
    xnxqmc: "test",
});

describe("parseCalendarData firstDay alignment", () => {
    test("Monday stays", () => {
        expect(make("2026-02-23").firstDay).toBe("2026-02-23");
    });
    test("Tuesday moves back", () => {
        expect(make("2026-02-24").firstDay).toBe("2026-02-23");
    });
    test("Wednesday moves back", () => {
        expect(make("2026-02-25").firstDay).toBe("2026-02-23");
    });
    test("Thursday moves back", () => {
        expect(make("2026-02-26").firstDay).toBe("2026-02-23");
    });
    test("Friday moves back", () => {
        expect(make("2026-02-27").firstDay).toBe("2026-02-23");
    });
    test("Saturday moves forward", () => {
        expect(make("2026-02-28").firstDay).toBe("2026-03-02");
    });
    test("Sunday moves forward", () => {
        expect(make("2026-03-01").firstDay).toBe("2026-03-02");
    });
});
