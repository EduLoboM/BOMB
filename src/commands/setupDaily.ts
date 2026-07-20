import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";

export const setupDaily: Command = {
    name: "setup_daily",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: "❌ This command can only be run inside a Discord server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const time = interaction.options.getString("time", true).trim();
        const days = interaction.options.getString("days", true).trim();

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
            await interaction.editReply({
                content: "❌ Invalid time format! Please use 24-hour format: `HH:MM` (e.g. `10:00`, `14:30`, `09:15`).",
            });
            return;
        }

        const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        const inputDays = days.split(",").map(d => d.trim().toLowerCase());
        const normalizedDays: string[] = [];
        const dayMapping: Record<string, string> = {
            monday: "mon", mon: "mon",
            tuesday: "tue", tue: "tue",
            wednesday: "wed", wed: "wed",
            thursday: "thu", thu: "thu",
            friday: "fri", fri: "fri",
            saturday: "sat", sat: "sat",
            sunday: "sun", sun: "sun"
        };

        const invalidDays: string[] = [];
        for (const d of inputDays) {
            const mapped = dayMapping[d];
            if (mapped) {
                if (!normalizedDays.includes(mapped)) {
                    normalizedDays.push(mapped);
                }
            } else {
                invalidDays.push(d);
            }
        }

        if (invalidDays.length > 0) {
            await interaction.editReply({
                content: `❌ Invalid day(s) provided: \`${invalidDays.join(", ")}\`. Please use abbreviations: \`mon,tue,wed,thu,fri,sat,sun\`.`,
            });
            return;
        }

        if (normalizedDays.length === 0) {
            await interaction.editReply({
                content: "❌ Please provide at least one valid day.",
            });
            return;
        }

        normalizedDays.sort((a, b) => validDays.indexOf(a) - validDays.indexOf(b));
        const weekdaysStr = normalizedDays.join(",");

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: "❌ No project exists for this server. Please create one first using `/create_project`.",
            });
            return;
        }

        await projectService.updateProjectSchedule(project.id, `${time}:00`, weekdaysStr);

        await interaction.editReply({
            content: `✅ Standup schedule for project **${project.name}** has been updated!\n` +
                `⏱️ **Time:** \`${time}\` (Server Time)\n` +
                `📅 **Days:** \`${weekdaysStr.toUpperCase()}\``,
        });
    }
};
