import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";

export const setupChannel: Command = {
    name: "setup_channel",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: "❌ This command can only be run inside a Discord server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = interaction.options.getChannel("channel", true);

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: "❌ No project exists for this server. Please create one first using `/create_project`.",
            });
            return;
        }

        await projectService.updateProjectChannel(project.id, channel.id);

        await interaction.editReply({
            content: `✅ Daily reports channel for project **${project.name}** has been set to <#${channel.id}>!`,
        });
    }
};
