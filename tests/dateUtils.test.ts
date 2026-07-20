import { describe, it, expect } from "vitest";
import { dateUtils } from "../src/utils/dateUtils.js";

describe("dateUtils - parsePeriodToMinutes", () => {
    describe("Happy Paths", () => {
        it("should parse simple minutes", () => {
            expect(dateUtils.parsePeriodToMinutes("30m")).toBe(30);
            expect(dateUtils.parsePeriodToMinutes("120m")).toBe(120);
        });

        it("should parse simple hours", () => {
            expect(dateUtils.parsePeriodToMinutes("1h")).toBe(60);
            expect(dateUtils.parsePeriodToMinutes("3h")).toBe(180);
        });

        it("should parse hours and minutes combined", () => {
            expect(dateUtils.parsePeriodToMinutes("1h30m")).toBe(90);
            expect(dateUtils.parsePeriodToMinutes("2h15m")).toBe(135);
        });

        it("should parse raw numbers as minutes", () => {
            expect(dateUtils.parsePeriodToMinutes("45")).toBe(45);
            expect(dateUtils.parsePeriodToMinutes("180")).toBe(180);
        });

        it("should be case-insensitive", () => {
            expect(dateUtils.parsePeriodToMinutes("1H30M")).toBe(90);
            expect(dateUtils.parsePeriodToMinutes("45M")).toBe(45);
            expect(dateUtils.parsePeriodToMinutes("2h")).toBe(120);
        });

        it("should ignore internal and surrounding whitespace", () => {
            expect(dateUtils.parsePeriodToMinutes("  1h 30m  ")).toBe(90);
            expect(dateUtils.parsePeriodToMinutes(" 45   m ")).toBe(45);
            expect(dateUtils.parsePeriodToMinutes("2 h 1 5 m")).toBe(135);
        });
    });

    describe("Sad Paths & Edge Cases", () => {
        it("should return null for invalid formats", () => {
            expect(dateUtils.parsePeriodToMinutes("abc")).toBeNull();
            expect(dateUtils.parsePeriodToMinutes("1h30")).toBeNull();
            expect(dateUtils.parsePeriodToMinutes("h")).toBeNull();
            expect(dateUtils.parsePeriodToMinutes("m")).toBeNull();
            expect(dateUtils.parsePeriodToMinutes("")).toBeNull();
        });

        it("should return null or handle negative values correctly", () => {
            expect(dateUtils.parsePeriodToMinutes("-30m")).toBeNull();
            expect(dateUtils.parsePeriodToMinutes("-5")).toBeNull();
            expect(dateUtils.parsePeriodToMinutes("0m")).toBe(0);
            expect(dateUtils.parsePeriodToMinutes("0")).toBe(0);
        });
    });
});

describe("dateUtils - addDaysToDateString", () => {
    describe("Happy Paths", () => {
        it("should add days within the same month", () => {
            expect(dateUtils.addDaysToDateString("2026-07-20", 5)).toBe("2026-07-25");
        });

        it("should subtract days within the same month", () => {
            expect(dateUtils.addDaysToDateString("2026-07-20", -5)).toBe("2026-07-15");
        });

        it("should return the same date when adding 0 days", () => {
            expect(dateUtils.addDaysToDateString("2026-07-20", 0)).toBe("2026-07-20");
        });
    });

    describe("Edge Cases (Boundaries & Leap Years)", () => {
        it("should handle transition to next month", () => {
            expect(dateUtils.addDaysToDateString("2026-07-31", 1)).toBe("2026-08-01");
            expect(dateUtils.addDaysToDateString("2026-07-31", 2)).toBe("2026-08-02");
        });

        it("should handle transition to previous month", () => {
            expect(dateUtils.addDaysToDateString("2026-08-01", -1)).toBe("2026-07-31");
        });

        it("should handle year boundaries", () => {
            expect(dateUtils.addDaysToDateString("2025-12-31", 1)).toBe("2026-01-01");
            expect(dateUtils.addDaysToDateString("2026-01-01", -1)).toBe("2025-12-31");
        });

        it("should handle leap years correctly", () => {
            expect(dateUtils.addDaysToDateString("2024-02-28", 1)).toBe("2024-02-29");
            expect(dateUtils.addDaysToDateString("2024-02-29", 1)).toBe("2024-03-01");

            expect(dateUtils.addDaysToDateString("2023-02-28", 1)).toBe("2023-03-01");
        });
    });
});

describe("dateUtils - getDateTimeInTimezone", () => {
    it("should format correct time and day across timezones", () => {
        const date = new Date("2026-07-20T22:30:00Z");
        
        const saPaulo = dateUtils.getDateTimeInTimezone(date, "America/Sao_Paulo");
        expect(saPaulo.time).toBe("19:30");
        expect(saPaulo.weekday).toBe("mon");
        expect(saPaulo.dateString).toBe("2026-07-20");

        const utc = dateUtils.getDateTimeInTimezone(date, "UTC");
        expect(utc.time).toBe("22:30");
        expect(utc.weekday).toBe("mon");
        expect(utc.dateString).toBe("2026-07-20");

        const tokyo = dateUtils.getDateTimeInTimezone(date, "Asia/Tokyo");
        expect(tokyo.time).toBe("07:30");
        expect(tokyo.weekday).toBe("tue");
        expect(tokyo.dateString).toBe("2026-07-21");
    });
});
