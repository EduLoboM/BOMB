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
            getMember: vi.fn(),
            getProjectMembers: vi.fn(),
            awardBadge: vi.fn(),
            getUserBadges: vi.fn()
        }
    };
});

vi.mock("../src/services/dailyService.js", () => {
    return {
        dailyService: {
            getDailyForUserToday: vi.fn(),
            getDailiesForProjectToday: vi.fn().mockResolvedValue([]),
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

const { mockExecute, mockMap } = vi.hoisted(() => {
    const mockExecute = vi.fn();
    const mockMap = new Map();
    mockMap.set("setup_daily", { execute: mockExecute });
    return { mockExecute, mockMap };
});

vi.mock("../src/commands/index.js", () => {
    return {
        commands: mockMap
    };
});

function createMockInteraction(type: "chat" | "button" | "modal" | "select", customId = "", fields: Record<string, string> = {}, guildId: string | null = "g1") {
    return {
        guildId,
        user: { id: "u1", tag: "user#1234" },
        isChatInputCommand: () => type === "chat",
        isButton: () => type === "button",
        isModalSubmit: () => type === "modal",
        isStringSelectMenu: () => type === "select",
        isRepliable: () => true,
        commandName: "setup_daily",
        customId,
        deferReply: vi.fn().mockResolvedValue(undefined),
        reply: vi.fn().mockResolvedValue(undefined),
        editReply: vi.fn().mockResolvedValue(undefined),
        deferUpdate: vi.fn().mockResolvedValue(undefined),
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
        expect(interaction.reply.mock.calls[0][0].content).toContain("servidor do Discord");
    });

    it("should fail if project does not exist", async () => {
        const interaction = createMockInteraction("button", "submit_daily_btn");
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(null);

        await handleInteraction(interaction);
        expect(interaction.reply).toHaveBeenCalled();
        expect(interaction.reply.mock.calls[0][0].content).toContain("Nenhuma guilda existe neste servidor");
    });

    it("should fail if user is not a project member", async () => {
        const interaction = createMockInteraction("button", "submit_daily_btn");
        const project = { id: "p1" };
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue(project as any);
        vi.mocked(userService.getMember).mockResolvedValue(null);

        await handleInteraction(interaction);
        expect(interaction.reply).toHaveBeenCalled();
        expect(interaction.reply.mock.calls[0][0].content).toContain("Você não é um aventureiro desta guilda");
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
        expect(interaction.reply.mock.calls[0][0].content).toContain("portal de submissão está fechado");
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

describe("handleInteraction - finish_project_modal_", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should award badges and delete project successfully", async () => {
        const interaction = createMockInteraction("modal", "finish_project_modal_p1", {
            description: "Site de leaks de OnlyFans",
            icon: "🐉"
        });
        vi.mocked(projectService.getProjectByGuild).mockResolvedValue({ id: "p1", name: "Dragoon", guild_id: "g1" } as any);
        vi.mocked(userService.getProjectMembers).mockResolvedValue([
            { id: "u1", display_name: "Alice" } as any
        ]);
        vi.mocked(userService.awardBadge).mockResolvedValue(undefined as any);
        vi.mocked(projectService.deleteProject).mockResolvedValue(undefined as any);

        await handleInteraction(interaction);
        expect(interaction.deferReply).toHaveBeenCalled();
        expect(userService.awardBadge).toHaveBeenCalledWith("u1", "Dragoon", "Site de leaks de OnlyFans", "🐉");
        expect(projectService.deleteProject).toHaveBeenCalledWith("p1");
        expect(interaction.editReply).toHaveBeenCalled();
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
        expect(interaction.editReply.mock.calls[0][0].content).toContain("Relatório de expedição enviado com sucesso");
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
