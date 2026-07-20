import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { reportUtils } from "../utils/reportUtils.js";

export const daily: Command = {
    name: "daily",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: "❌ This command can only be run inside a Discord server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.reply({
                content: "❌ No project exists for this server. Please create one first using `/create_project`.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const member = await userService.getMember(interaction.user.id, project.id);
        if (!member) {
            await interaction.reply({
                content: "❌ You are not a member of this project. Join using `/join_project` with the invite code.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await reportUtils.showDailyModal(interaction);
    }
};
