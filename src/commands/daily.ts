import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { reportUtils } from "../utils/reportUtils.js";
import { ICONS, errorMsg } from "../utils/theme.js";

export const daily: Command = {
    name: "daily",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("This command can only be run inside a Discord server."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.reply({
                content: errorMsg("No project exists for this server. Please create one first using `/create_project`."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const member = await userService.getMember(interaction.user.id, project.id);
        if (!member) {
            await interaction.reply({
                content: errorMsg("You are not a member of this project. Join using `/join_project` with the invite code."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const isOpen = reportUtils.isDailyOpen(project);
        if (!isOpen) {
            const dailyTime = project.daily_time ? project.daily_time.substring(0, 5) : "N/A";
            const period = project.daily_period ? `${project.daily_period}m` : "N/A";
            await interaction.reply({
                content: errorMsg(`The daily standup submission period is closed. It is only open for ${period} starting at ${dailyTime}.`),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await reportUtils.showDailyModal(interaction);
    }
};
