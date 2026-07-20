import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import {
    COLORS, ICONS,
    buildEmbed, errorMsg
} from "../utils/theme.js";

export const setupChannel: Command = {
    name: "setup_channel",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("This command can only be run inside a Discord server."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = interaction.options.getChannel("channel", true);

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: errorMsg("No project exists for this server. Please create one first using `/create_project`."),
            });
            return;
        }

        await projectService.updateProjectChannel(project.id, channel.id);

        const embed = buildEmbed({
            title: `${ICONS.success}  Channel Configured`,
            description: [
                `${ICONS.channel} Daily report channel for **${project.name}** has been set to <#${channel.id}>`,
                "",
                `${ICONS.arrow} Standup reports will now be posted there.`,
            ].join("\n"),
            color: COLORS.success,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
