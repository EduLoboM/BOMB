import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";

export const sprintRepeat: Command = {
    name: "sprint_repeat",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: "❌ This command can only be run inside a Discord server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const enabled = interaction.options.getBoolean("enabled", true);

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: "❌ No project exists for this server. Please create one first using `/create_project`.",
            });
            return;
        }

        if (enabled && !project.sprint_duration) {
            await interaction.editReply({
                content: "❌ Cannot enable auto-repeat: No default sprint duration is set. Run `/setup_sprint` first to define a sprint and duration.",
            });
            return;
        }

        await projectService.updateProjectSprintSettings(project.id, enabled, project.sprint_duration || 0);

        await interaction.editReply({
            content: `✅ Automatic sprint repetition for project **${project.name}** has been **${enabled ? "ENABLED" : "DISABLED"}**.`,
        });
    }
};
