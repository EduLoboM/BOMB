import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkAndSendStandups, checkAndRepeatSprints } from "../src/scheduler/standupScheduler.js";
import { projectService } from "../src/services/projectService.js";
import { sprintService } from "../src/services/sprintService.js";
import { reportUtils } from "../src/utils/reportUtils.js";

vi.mock("../src/services/projectService.js", () => {
    return {
        projectService: {
            getAllScheduledProjects: vi.fn(),
            getProjectsWithSprintRepeat: vi.fn()
        }
    };
});

vi.mock("../src/services/sprintService.js", () => {
    return {
        sprintService: {
            getSprints: vi.fn(),
            createSprint: vi.fn()
        }
    };
});

vi.mock("../src/utils/reportUtils.js", () => {
    return {
        reportUtils: {
            sendOrUpdateDailyReport: vi.fn()
        }
    };
});

describe("Standup Scheduler", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should skip standup alerts when time does not match", async () => {
        vi.setSystemTime(new Date("2026-07-20T10:30:00Z"));
        const projects = [
            { id: "p1", name: "BOMB", daily_time: "11:00:00", weekdays: "mon", timezone: "UTC", guild_id: "g1" }
        ];
        vi.mocked(projectService.getAllScheduledProjects).mockResolvedValue(projects as any);

        await checkAndSendStandups({} as any);
        expect(reportUtils.sendOrUpdateDailyReport).not.toHaveBeenCalled();
    });

    it("should skip standup alerts when weekday does not match", async () => {
        vi.setSystemTime(new Date("2026-07-19T10:00:00Z"));
        const projects = [
            { id: "p1", name: "BOMB", daily_time: "10:00:00", weekdays: "mon", timezone: "UTC", guild_id: "g1" }
        ];
        vi.mocked(projectService.getAllScheduledProjects).mockResolvedValue(projects as any);

        await checkAndSendStandups({} as any);
        expect(reportUtils.sendOrUpdateDailyReport).not.toHaveBeenCalled();
    });

    it("should trigger standup alert when time and weekday match", async () => {
        vi.setSystemTime(new Date("2026-07-20T10:00:00Z"));
        const projects = [
            { id: "p1", name: "BOMB", daily_time: "10:00:00", weekdays: "mon", timezone: "UTC", guild_id: "g1" }
        ];
        vi.mocked(projectService.getAllScheduledProjects).mockResolvedValue(projects as any);
        vi.mocked(reportUtils.sendOrUpdateDailyReport).mockResolvedValue(undefined as any);

        await checkAndSendStandups({} as any);
        expect(reportUtils.sendOrUpdateDailyReport).toHaveBeenCalledWith({} as any, projects[0], "2026-07-20");
    });
});

describe("Sprint Rollover Scheduler", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should skip rollover if latest sprint has not ended", async () => {
        vi.setSystemTime(new Date("2026-07-20T12:00:00Z"));
        const projects = [
            { id: "p1", name: "BOMB", sprint_duration: 14, timezone: "UTC" }
        ];
        const sprints = [
            { id: "s1", number: 1, end_date: "2026-07-25" }
        ];
        vi.mocked(projectService.getProjectsWithSprintRepeat).mockResolvedValue(projects as any);
        vi.mocked(sprintService.getSprints).mockResolvedValue(sprints as any);

        await checkAndRepeatSprints();
        expect(sprintService.createSprint).not.toHaveBeenCalled();
    });

    it("should trigger rollover and create next sprint when current ends", async () => {
        vi.setSystemTime(new Date("2026-07-26T12:00:00Z"));
        const projects = [
            { id: "p1", name: "BOMB", sprint_duration: 14, timezone: "UTC" }
        ];
        const sprints = [
            { id: "s1", number: 1, end_date: "2026-07-25" }
        ];
        vi.mocked(projectService.getProjectsWithSprintRepeat).mockResolvedValue(projects as any);
        vi.mocked(sprintService.getSprints).mockResolvedValue(sprints as any);
        vi.mocked(sprintService.createSprint).mockResolvedValue(undefined as any);

        await checkAndRepeatSprints();
        expect(sprintService.createSprint).toHaveBeenCalledWith("p1", 2, "2026-07-26", "2026-08-08");
    });
});
