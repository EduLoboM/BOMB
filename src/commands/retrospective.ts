import {
    ChatInputCommandInteraction,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { sprintService } from "../services/sprintService.js";
import { planningService } from "../services/planningService.js";
import {
    COLORS, ICONS, HEADERS,
    buildEmbed, errorMsg, successMsg
} from "../utils/theme.js";
import { RetroCategory } from "../types.js";

export function renderRetroBoard(project: any, sprintNumber: number | string, items: any[]) {
    const wentWell = items.filter(i => i.category === "went_well");
    const toImprove = items.filter(i => i.category === "to_improve");
    const actionItems = items.filter(i => i.category === "action_item");

    const formatCategory = (categoryItems: any[], emptyMsg: string) => {
        if (categoryItems.length === 0) return [emptyMsg];
        return categoryItems.map(item => {
            const authorStr = item.author ? `<@${item.author.discord_id}>` : "Anônimo";
            const upvoteStr = `👍 ${item.upvotes || 0}`;
            return `• **"${item.content}"** (${upvoteStr})\n   └─ por ${authorStr}`;
        });
    };

    const description = [
        HEADERS.sprint,
        "",
        `💡 **Quadro de Retrospectiva da Guilda** — **${project.name}** (Sprint #${sprintNumber})`,
        "",
        `🟢 **O que funcionou bem? (Quest Victories):**`,
        ...formatCategory(wentWell, "*Nenhum item registrado ainda.*"),
        "",
        `🔴 **O que podemos melhorar? (Boss Traps):**`,
        ...formatCategory(toImprove, "*Nenhum item registrado ainda.*"),
        "",
        `💡 **Ações & Ideias para a Próxima Expedição (Quest Tactics):**`,
        ...formatCategory(actionItems, "*Nenhuma ação registrada ainda.*"),
        "",
        `${ICONS.sparkle} *Contribua com a retrospectiva do time para evoluir a cada sprint e ganhar XP!*`
    ].join("\n");

    const embed = buildEmbed({
        title: `🏛️  Retrospectiva da Expedição`,
        description,
        color: COLORS.secondary
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("retro_add_went_well_btn")
            .setLabel("Funcionou Bem")
            .setEmoji("🟢")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("retro_add_to_improve_btn")
            .setLabel("Pode Melhorar")
            .setEmoji("🔴")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId("retro_add_action_item_btn")
            .setLabel("Ação / Ideia")
            .setEmoji("💡")
            .setStyle(ButtonStyle.Primary)
    );

    return { embed, row };
}

export const retrospectiveCommand: Command = {
    name: "retrospective",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."),
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({ content: errorMsg("Nenhum projeto registrado neste servidor.") });
            return;
        }

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);
        const activeSprint = await sprintService.getActiveSprint(project.id);
        const sprintId = activeSprint?.id;
        const sprintNum = activeSprint ? activeSprint.number : "Geral";

        if (subcommand === "board") {
            const items = await planningService.getRetroItems(project.id, user.id, sprintId);
            const { embed, row } = renderRetroBoard(project, sprintNum, items);

            await interaction.editReply({ embeds: [embed], components: [row] });
            return;
        }

        if (subcommand === "add_item") {
            const category = interaction.options.getString("category", true) as RetroCategory;
            const content = interaction.options.getString("content", true).trim();

            await planningService.addRetroItem(project.id, user.id, category, content, sprintId);

            await interaction.editReply({
                content: successMsg(`Item adicionado à retrospectiva com sucesso! 💡 (+15 XP concedidos pela contribuição!)`)
            });
            return;
        }

        if (subcommand === "conclude") {
            const summaryNotes = interaction.options.getString("summary") || undefined;
            const result = await planningService.concludeRetro(project.id, sprintId, summaryNotes);

            const actionItemLines = result.actionItems.length > 0
                ? result.actionItems.map(a => `📌 **${a.content}** (por <@${a.author?.discord_id || ''}>, 👍 ${a.upvotes})`)
                : ["*Nenhuma ação específica registrada nesta retrospectiva.*"];

            const embed = buildEmbed({
                title: `🎉  Retrospectiva Concluída!`,
                description: [
                    HEADERS.victory,
                    "",
                    `A Retrospectiva da Expedição #${sprintNum} foi finalizada!`,
                    "",
                    `📜 **Resumo Executivo & Aprendizados:**`,
                    `├─ 🟢 **Conquistas:** ${result.wentWell.length} item(ns)`,
                    `├─ 🔴 **Melhorias:** ${result.toImprove.length} item(ns)`,
                    `└─ 💡 **Planos de Ação:** ${result.actionItems.length} item(ns)`,
                    "",
                    `🎯 **Ações Definidas para o Próximo Sprint:**`,
                    ...actionItemLines,
                    "",
                    `📜 **Notas Finais:** *"${result.summaryNotes}"*`,
                    "",
                    `${ICONS.sparkle} *Excelente trabalho de alinhamento e evolução contínua da guilda!*`
                ].join("\n"),
                color: COLORS.success
            });

            await interaction.editReply({ embeds: [embed] });
            return;
        }
    }
};
