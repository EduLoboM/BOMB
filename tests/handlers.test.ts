import { vi, describe, it, expect, beforeEach } from "vitest";
import { handleInteraction } from "../src/handlers/interactionHandler.js";

vi.mock("../src/supabase.js", () => {
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        single: vi.fn().mockResolvedValue({ data: { id: "p1", name: "Test Project" } }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockResolvedValue({ data: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [] })
      })
    }
  };
});

function createMockInteraction(
  type: "chat" | "button" | "modal" | "select" | "context",
  commandName = "bomb",
  subcommand = "table",
  customId = "",
  fields: Record<string, string> = {},
  guildId: string | null = "g1"
) {
  return {
    guildId,
    channelId: "c1",
    user: { id: "u1", username: "testuser", displayName: "Test User" },
    isChatInputCommand: () => type === "chat",
    isContextMenuCommand: () => type === "context",
    isButton: () => type === "button",
    isModalSubmit: () => type === "modal",
    isStringSelectMenu: () => type === "select",
    isChannelSelectMenu: () => false,
    isRepliable: () => true,
    replied: false,
    commandName,
    options: {
      getSubcommand: () => subcommand,
      getMessage: () => ({ content: "Help needed here" }),
      getUser: () => ({ username: "otheruser" }),
      getString: vi.fn().mockReturnValue(null)
    },
    customId,
    showModal: vi.fn().mockResolvedValue(undefined),
    deferReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    deferUpdate: vi.fn().mockResolvedValue(undefined),
    fields: {
      getTextInputValue: vi.fn().mockImplementation((name) => fields[name] ?? "")
    },
    client: {
      channels: {
        fetch: vi.fn().mockResolvedValue({
          isTextBased: () => true,
          send: vi.fn().mockResolvedValue({ id: "msg1" }),
          messages: {
            fetch: vi.fn().mockResolvedValue({
              edit: vi.fn().mockResolvedValue({})
            })
          }
        })
      }
    }
  } as any;
}

describe("handleInteraction - New UX Architecture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle /bomb table command", async () => {
    const interaction = createMockInteraction("chat", "bomb", "table");
    await handleInteraction(interaction);
    expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(interaction.editReply).toHaveBeenCalledWith({ content: '✅ Mesa da Guilda atualizada e afixada neste canal com sucesso!' });
  });

  it("should handle /daily command by opening daily modal", async () => {
    const interaction = createMockInteraction("chat", "daily");
    await handleInteraction(interaction);
    expect(interaction.showModal).toHaveBeenCalled();
  });

  it("should handle /help_me command without arguments by displaying full guide embed", async () => {
    const interaction = createMockInteraction("chat", "help_me");
    await handleInteraction(interaction);
    expect(interaction.reply).toHaveBeenCalled();
  });

  it("should handle /help_me command with duvida argument by opening help modal", async () => {
    const interaction = createMockInteraction("chat", "help_me");
    interaction.options.getString = vi.fn().mockReturnValue("Dúvida de teste");
    await handleInteraction(interaction);
    expect(interaction.showModal).toHaveBeenCalled();
  });

  it("should handle btn_daily_open button click", async () => {
    const interaction = createMockInteraction("button", "", "", "btn_daily_open");
    await handleInteraction(interaction);
    expect(interaction.showModal).toHaveBeenCalled();
  });

  it("should handle btn_hand_help_open button click", async () => {
    const interaction = createMockInteraction("button", "", "", "btn_hand_help_open");
    await handleInteraction(interaction);
    expect(interaction.showModal).toHaveBeenCalled();
  });

  it("should handle btn_profile_cards button click", async () => {
    const interaction = createMockInteraction("button", "", "", "btn_profile_cards");
    await handleInteraction(interaction);
    expect(interaction.reply).toHaveBeenCalled();
  });

  it("should handle btn_kudos_ button click", async () => {
    const interaction = createMockInteraction("button", "", "", "btn_kudos_123");
    await handleInteraction(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: '👏 **Kudos Enviado!** Você concedeu +10 XP para o autor desta daily.',
      ephemeral: true
    });
  });

  it("should handle Message Context Menu '🖐️ Solicitar Mão Amiga'", async () => {
    const interaction = createMockInteraction("context", "🖐️ Solicitar Mão Amiga");
    (interaction as any).commandType = 3;
    await handleInteraction(interaction);
    expect(interaction.showModal).toHaveBeenCalled();
  });
});
