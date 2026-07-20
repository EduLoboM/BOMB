import { vi, describe, it, expect, beforeEach } from "vitest";
import { handleInteraction } from "../src/handlers/interactionHandler.js";
import { projectService } from "../src/services/projectService.js";
import { userService } from "../src/services/userService.js";
import { dailyService } from "../src/services/dailyService.js";
import { reportUtils } from "../src/utils/reportUtils.js";
import { commands } from "../src/commands/index.js";

vi.mock("../src/services/projectService.js", () => {
    return {
        projectService: {
            getProjectByGuild: vi.fn(),
            deleteProject: vi.fn()
        }
    };
});

vi.mock("../src/services/userService.js", () => {
    return {
        userService: {
            getMember: vi.fn()
        }
    };
});

vi.mock("../src/services/dailyService.js", () => {
    return {
        dailyService: {
            getDailyForUserToday: vi.fn(),
            updateDaily: vi.fn(),
            createDaily: vi.fn()
        }
    };
});

vi.mock("../src/utils/reportUtils.js", () => {
    return {
        reportUtils: {
            isDailyOpen: vi.fn(),
            showDailyModal: vi.fn(),
            sendOrUpdateDailyReport: vi.fn()
        }
    };
});

vi.mock("../src/commands/index.js", () => {
    const mockMap = new Map();
    mockMap.set("setup_daily", { execute: vi.fn() });
    return {
        commands: mockMap
    };
});

function createMockInteraction(type: "chat" | "button" | "modal", customId = "", fields: Record<string, string> = {}, guildId: string | null = "g1") {
    return {
        guildId,
        user: { id: "u1", tag: "user#1234" },
        isChatInputCommand: () => type === "chat",
        isButton: () => type === "button",
        isModalSubmit: () => type === "modal",
        isRepliable: () => true,
        commandName: "setup_daily",
        customId,
        deferReply: vi.fn(),
        reply: vi.fn(),
        editReply: vi.fn(),
        deferUpdate: vi.fn(),
        memberPermissions: {
            has: vi.fn().mockReturnValue(true)
        },
        fields: {
            getTextInputValue: vi.fn().mockImplementation((name) => fields[name] ?? "")
        },
        client: {}
    } as any;
}

describe("handleInteraction - Commands", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should route command execution", async () => {
        const interaction = createMockInteraction("chat");
        await handleInteraction(interaction);
        const cmd = commands.get("setup_daily");
        expect(cmd?.execute).toHaveBeenCalledWith(interaction, interaction.client);
    });
});

describe("handleInteraction - submit_daily_btn", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fail if clicked outside a server", async () => {
        const interaction = createMockInteraction("button", "submit_daily_btn", {}, null);
        await handleInteraction(interaction);
        expect(interaction.reply).toHaveBeenCalled();
        expect(interaction.reply.mock.calls[0][0].content).toContain("only be clicked inside a Discord server");
    });

    it("should fail if project does not exist", async () => {
        const interaction = createMockInteraction("button", "submit_daily_btn");
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(null);

        await handleInteraction(interaction);
        expect(interaction.reply).toHaveBeenCalled();
        expect(interaction.reply.mock.calls[0][0].content).toContain("No project exists for this server");
    });

    it("should fail if user is not a project member", async () => {
        const interaction = createMockInteraction("button", "submit_daily_btn");
        const project = { id: "p1" };
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(project as any);
        vi.mocked(userService.getMember).mockResolvedValue(null);

        await handleInteraction(interaction);
        expect(interaction.reply).toHaveBeenCalled();
        expect(interaction.reply.mock.calls[0][0].content).toContain("You are not a member of this project");
    });

    it("should fail if daily stands are closed", async () => {
        const interaction = createMockInteraction("button", "submit_daily_btn");
        const project = { id: "p1", daily_time: "10:00:00", daily_period: 30 };
        const member = { id: "m1" };
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(project as any);
        vi.mocked(userService.getMember).mockResolvedValue(member as any);
        vi.mocked(reportUtils.isDailyOpen).mockReturnValue(false);

        await handleInteraction(interaction);
        expect(interaction.reply).toHaveBeenCalled();
        expect(interaction.reply.mock.calls[0][0].content).toContain("submission period is closed");
    });

    it("should display modal if daily stands are open", async () => {
        const interaction = createMockInteraction("button", "submit_daily_btn");
        const project = { id: "p1", daily_time: "10:00:00", daily_period: 30 };
        const member = { id: "m1" };
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(project as any);
        vi.mocked(userService.getMember).mockResolvedValue(member as any);
        vi.mocked(reportUtils.isDailyOpen).mockReturnValue(true);
        vi.mocked(reportUtils.showDailyModal).mockResolvedValue(undefined as any);

        await handleInteraction(interaction);
        expect(reportUtils.showDailyModal).toHaveBeenCalledWith(interaction);
    });
});

describe("handleInteraction - confirm_finish_project_", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fail if admin permissions are missing", async () => {
        const interaction = createMockInteraction("button", "confirm_finish_project_p1");
        interaction.memberPermissions.has.mockReturnValue(false);

        await handleInteraction(interaction);
        expect(interaction.reply).toHaveBeenCalled();
        expect(interaction.reply.mock.calls[0][0].content).toContain("Only server administrators can confirm");
    });

    it("should delete project and confirm successfully", async () => {
        const interaction = createMockInteraction("button", "confirm_finish_project_p1");
        vi.mocked(projectService.deleteProject).mockResolvedValue(undefined as any);

        await handleInteraction(interaction);
        expect(interaction.deferUpdate).toHaveBeenCalled();
        expect(projectService.deleteProject).toHaveBeenCalledWith("p1");
        expect(interaction.editReply).toHaveBeenCalled();
        expect(interaction.editReply.mock.calls[0][0].content).toContain("successfully deleted");
    });
});

describe("handleInteraction - daily_modal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should insert response if not submitted yet today", async () => {
        const fields = { done: "done task", todo: "todo task", blockers: "none" };
        const interaction = createMockInteraction("modal", "daily_modal", fields);
        const project = { id: "p1", channel_id: "c1" };
        const member = { id: "m1" };
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(project as any);
        vi.mocked(userService.getMember).mockResolvedValue(member as any);
        vi.mocked(dailyService.getDailyForUserToday).mockResolvedValue(null);
        vi.mocked(dailyService.createDaily).mockResolvedValue(undefined as any);
        vi.mocked(reportUtils.sendOrUpdateDailyReport).mockResolvedValue(undefined as any);

        await handleInteraction(interaction);
        expect(interaction.deferReply).toHaveBeenCalled();
        expect(dailyService.createDaily).toHaveBeenCalledWith("m1", "p1", "done task", "todo task", "none");
        expect(reportUtils.sendOrUpdateDailyReport).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalled();
        expect(interaction.editReply.mock.calls[0][0].content).toContain("submitted successfully");
    });

    it("should update response if already submitted today", async () => {
        const fields = { done: "updated done", todo: "updated todo", blockers: "none" };
        const interaction = createMockInteraction("modal", "daily_modal", fields);
        const project = { id: "p1", channel_id: "c1" };
        const member = { id: "m1" };
        const existingDaily = { id: "d1" };
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(project as any);
        vi.mocked(userService.getMember).mockResolvedValue(member as any);
        vi.mocked(dailyService.getDailyForUserToday).mockResolvedValue(existingDaily as any);
        vi.mocked(dailyService.updateDaily).mockResolvedValue(undefined as any);
        vi.mocked(reportUtils.sendOrUpdateDailyReport).mockResolvedValue(undefined as any);

        await handleInteraction(interaction);
        expect(dailyService.updateDaily).toHaveBeenCalledWith("d1", "updated done", "updated todo", "none");
        expect(reportUtils.sendOrUpdateDailyReport).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalled();
    });
});
