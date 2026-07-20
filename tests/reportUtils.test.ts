import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportUtils } from "../src/utils/reportUtils.js";

describe("reportUtils - isDailyOpen", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Basic Setup Fallbacks", () => {
        it("should return true if daily_time or weekdays is not configured", () => {
            const project = {
                daily_time: null,
                weekdays: null,
                daily_period: null,
                timezone: "UTC"
            };
            expect(reportUtils.isDailyOpen(project)).toBe(true);
        });
    });

    describe("Same-Day Windows", () => {
        const project = {
            daily_time: "10:00:00",
            weekdays: "mon,tue,wed",
            daily_period: 60,
            timezone: "UTC"
        };

        it("should be open exactly at start time", () => {
            vi.setSystemTime(new Date("2026-07-20T10:00:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(true);
        });

        it("should be open exactly at end time", () => {
            vi.setSystemTime(new Date("2026-07-20T11:00:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(true);
        });

        it("should be open within the window", () => {
            vi.setSystemTime(new Date("2026-07-20T10:30:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(true);
        });

        it("should be closed 1 minute before start time", () => {
            vi.setSystemTime(new Date("2026-07-20T09:59:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(false);
        });

        it("should be closed 1 minute after end time", () => {
            vi.setSystemTime(new Date("2026-07-20T11:01:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(false);
        });

        it("should be closed if current weekday is not in the schedule list", () => {
            vi.setSystemTime(new Date("2026-07-19T10:30:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(false);
        });
    });

    describe("Midnight-Spanning Windows", () => {
        const project = {
            daily_time: "23:30:00",
            weekdays: "mon",
            daily_period: 60,
            timezone: "UTC"
        };

        it("should be open before midnight on the scheduled day", () => {
            vi.setSystemTime(new Date("2026-07-20T23:45:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(true);
        });

        it("should be open after midnight on the following calendar day", () => {
            vi.setSystemTime(new Date("2026-07-21T00:15:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(true);
        });

        it("should be open exactly at the midnight-spanning boundary limit", () => {
            vi.setSystemTime(new Date("2026-07-21T00:30:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(true);
        });

        it("should be closed 1 minute after the midnight-spanning window limit", () => {
            vi.setSystemTime(new Date("2026-07-21T00:31:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(false);
        });

        it("should be closed if yesterday was not a scheduled day when checking after-midnight window", () => {
            vi.setSystemTime(new Date("2026-07-20T00:15:00Z"));
            expect(reportUtils.isDailyOpen(project)).toBe(false);
        });
    });

    describe("Timezone Shifting Boundaries", () => {
        it("should map UTC day to local day properly (West of UTC)", () => {
            vi.setSystemTime(new Date("2026-07-22T01:30:00Z"));

            const project = {
                daily_time: "22:00:00",
                weekdays: "tue",
                daily_period: 120,
                timezone: "America/Sao_Paulo"
            };

            expect(reportUtils.isDailyOpen(project)).toBe(true);
        });

        it("should map UTC day to local day properly (East of UTC)", () => {
            vi.setSystemTime(new Date("2026-07-20T16:30:00Z"));

            const project = {
                daily_time: "01:00:00",
                weekdays: "tue",
                daily_period: 60,
                timezone: "Asia/Tokyo"
            };

            expect(reportUtils.isDailyOpen(project)).toBe(true);
        });
    });
});
