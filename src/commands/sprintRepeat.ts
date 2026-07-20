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
                content: errorMsg("This command can only be run inside a Discord server."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const enabled = interaction.options.getBoolean("enabled", true);

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: errorMsg("No project exists for this server. Please create one first using `/create_project`."),
            });
            return;
        }

        if (enabled && !project.sprint_duration) {
            await interaction.editReply({
                content: errorMsg("Cannot enable auto-repeat: No default sprint duration is set. Run `/setup_sprint` first to define a sprint and duration."),
            });
            return;
        }

        await projectService.updateProjectSprintSettings(project.id, enabled, project.sprint_duration || 0);

        const badge = statusBadge(enabled ? "Enabled" : "Disabled", enabled);

        const embed = buildEmbed({
            title: `${ICONS.repeat}  Sprint Auto-Repeat`,
            description: [
                `${ICONS.diamond} Auto-repeat for **${project.name}** has been updated.`,
                "",
                `${ICONS.arrow} Status: ${badge}`,
                "",
                enabled
                    ? `${ICONS.sparkle} *Sprints will be automatically created when the current one ends.*`
                    : `${ICONS.info} *Sprints will no longer be created automatically.*`,
            ].join("\n"),
            color: enabled ? COLORS.success : COLORS.neutral,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
