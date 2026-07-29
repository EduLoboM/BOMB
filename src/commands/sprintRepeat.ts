import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import {
    COLORS, ICONS,
    buildEmbed, statusBadge, errorMsg
} from "../utils/theme.js";

export const sprintRepeat: Command = {
    name: "sprint_repeat",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const enabled = interaction.options.getBoolean("enabled", true);

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: errorMsg("Nenhuma guilda existe neste servidor. Crie uma primeiro usando `/create_project`."),
            });
            return;
        }

        if (enabled && !project.sprint_duration) {
            await interaction.editReply({
                content: errorMsg("Não é possível ativar auto-repeat: nenhuma duração padrão de expedição definida. Execute `/setup_sprint` primeiro."),
            });
            return;
        }

        await projectService.updateProjectSprintSettings(project.id, enabled, project.sprint_duration || 0);

        const badge = statusBadge(enabled ? "Ativado" : "Desativado", enabled);

        const embed = buildEmbed({
            title: `🔄  Expedição Perpétua`,
            description: [
                `${ICONS.diamond} Auto-repeat da guilda **${project.name}** foi atualizado.`,
                "",
                `${ICONS.arrow} Status: ${badge}`,
                "",
                enabled
                    ? `${ICONS.sparkle} *Novas expedições serão criadas automaticamente quando a atual terminar!*`
                    : `💡 *Expedições não serão mais criadas automaticamente.*`,
            ].join("\n"),
            color: enabled ? COLORS.success : COLORS.neutral,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
