import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupDaily } from "../src/commands/setupDaily.js";
import { setupSprint } from "../src/commands/setupSprint.js";
import { projectService } from "../src/services/projectService.js";
import { sprintService } from "../src/services/sprintService.js";

vi.mock("../src/services/projectService.js", () => {
    return {
        projectService: {
            getProjectByGuild: vi.fn(),
            updateProjectSchedule: vi.fn(),
            updateProjectSprintSettings: vi.fn()
        }
    };
});

vi.mock("../src/services/sprintService.js", () => {
    return {
        sprintService: {
            getLatestSprintNumber: vi.fn(),
            createSprint: vi.fn()
        }
    };
});

function createMockInteraction(options: Record<string, any>, guildId: string | null = "g1") {
    return {
        guildId,
        deferReply: vi.fn().mockResolvedValue(undefined),
        reply: vi.fn().mockResolvedValue(undefined),
        editReply: vi.fn().mockResolvedValue(undefined),
        options: {
            getString: vi.fn().mockImplementation((name) => options[name] ?? null),
            getInteger: vi.fn().mockImplementation((name) => options[name] ?? null),
            getBoolean: vi.fn().mockImplementation((name) => options[name] ?? null)
        }
    } as any;
}

describe("Slash Commands - setup_daily", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fail if not run in a server", async () => {
        const interaction = createMockInteraction({}, null);
        await setupDaily.execute(interaction, {} as any);
        expect(interaction.reply).toHaveBeenCalled();
        expect(interaction.reply.mock.calls[0][0].content).toContain("only be run inside a Discord server");
    });

    it("should fail on invalid time format", async () => {
        const interaction = createMockInteraction({ time: "25:00", days: "mon", period: "30m" });
        await setupDaily.execute(interaction, {} as any);
        expect(interaction.deferReply).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalled();
        expect(interaction.editReply.mock.calls[0][0].content).toContain("Invalid time format");
    });

    it("should fail on invalid period format", async () => {
        const interaction = createMockInteraction({ time: "10:00", days: "mon", period: "abc" });
        await setupDaily.execute(interaction, {} as any);
        expect(interaction.editReply).toHaveBeenCalled();
        expect(interaction.editReply.mock.calls[0][0].content).toContain("Invalid period format");
    });

    it("should fail on invalid timezone", async () => {
        const interaction = createMockInteraction({ time: "10:00", days: "mon", period: "30m", timezone: "Invalid/Zone" });
        await setupDaily.execute(interaction, {} as any);
        expect(interaction.editReply).toHaveBeenCalled();
        expect(interaction.editReply.mock.calls[0][0].content).toContain("Invalid timezone");
    });

    it("should fail if no project exists", async () => {
        const interaction = createMockInteraction({ time: "10:00", days: "mon", period: "30m" });
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(null);

        await setupDaily.execute(interaction, {} as any);
        expect(interaction.editReply).toHaveBeenCalled();
        expect(interaction.editReply.mock.calls[0][0].content).toContain("No project exists for this server");
    });

    it("should update schedule successfully", async () => {
        const interaction = createMockInteraction({ time: "10:00", days: "mon,tue", period: "30m", timezone: "UTC" });
        const project = { id: "p1", name: "BOMB" };
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(project as any);
        vi.mocked(projectService.updateProjectSchedule).mockResolvedValue(undefined as any);

        await setupDaily.execute(interaction, {} as any);
        expect(projectService.updateProjectSchedule).toHaveBeenCalledWith("p1", "10:00:00", "mon,tue", 30, "UTC");
        expect(interaction.editReply).toHaveBeenCalled();
        const replyArg = interaction.editReply.mock.calls[0][0];
        expect(replyArg.embeds).toBeDefined();
        expect(replyArg.embeds[0].data.description).toContain("BOMB");
    });
});

describe("Slash Commands - setup_sprint", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fail if duration days is not positive", async () => {
        const interaction = createMockInteraction({ start: "today", days: 0, repeat: true });
        await setupSprint.execute(interaction, {} as any);
        expect(interaction.editReply).toHaveBeenCalled();
        expect(interaction.editReply.mock.calls[0][0].content).toContain("positive number of days");
    });

    it("should fail on invalid start date format", async () => {
        const interaction = createMockInteraction({ start: "invalid-date", days: 14, repeat: true });
        await setupSprint.execute(interaction, {} as any);
        expect(interaction.editReply).toHaveBeenCalled();
        expect(interaction.editReply.mock.calls[0][0].content).toContain("Invalid start date format");
    });

    it("should create sprint successfully for today", async () => {
        const interaction = createMockInteraction({ start: "today", days: 14, repeat: true });
        const project = { id: "p1", name: "BOMB", timezone: "UTC" };
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(project as any);
        vi.mocked(sprintService.getLatestSprintNumber).mockResolvedValue(0);
        vi.mocked(sprintService.createSprint).mockResolvedValue(undefined as any);
        vi.mocked(projectService.updateProjectSprintSettings).mockResolvedValue(undefined as any);

        await setupSprint.execute(interaction, {} as any);
        expect(sprintService.createSprint).toHaveBeenCalled();
        expect(projectService.updateProjectSprintSettings).toHaveBeenCalledWith("p1", true, 14);
        expect(interaction.editReply).toHaveBeenCalled();
        const replyArg = interaction.editReply.mock.calls[0][0];
        expect(replyArg.embeds).toBeDefined();
        expect(replyArg.embeds[0].data.description).toContain("BOMB");
    });
});
