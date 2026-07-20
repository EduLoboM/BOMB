import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { sprintService } from "../services/sprintService.js";
import { dateUtils } from "../utils/dateUtils.js";

export const projectStatus: Command = {
    name: "project_status",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: "❌ This command can only be run inside a Discord server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: "❌ No project has been created for this server yet. Ask a project leader to run `/create_project`.",
            });
            return;
        }

        const members = await userService.getProjectMembers(project.id);
        const sprints = await sprintService.getSprints(project.id);

        let sprintStatusText = "N/A";
        if (sprints.length > 0) {
            const todayStr = dateUtils.getLocalDateString();
            const currentSprint = sprints.find(s => s.start_date <= todayStr && todayStr <= s.end_date);

            if (currentSprint) {
                const daysLeft = Math.ceil(
                    (new Date(currentSprint.end_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
                );
                sprintStatusText = `🏃 **Sprint #${currentSprint.number}** (Active)\n` +
                    `└ **Duration:** ${currentSprint.start_date} to ${currentSprint.end_date}\n` +
                    `└ **Time Remaining:** ${daysLeft} day(s) left`;
            } else {
                const upcomingSprint = sprints
                    .filter(s => s.start_date > todayStr)
                    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

                if (upcomingSprint) {
                    sprintStatusText = `📅 **Sprint #${upcomingSprint.number}** (Upcoming)\n` +
                        `└ **Duration:** ${upcomingSprint.start_date} to ${upcomingSprint.end_date}\n` +
                        `└ Starts in: ${Math.ceil((new Date(upcomingSprint.start_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24))} day(s)`;
                } else {
                    const latestSprint = sprints[0];
                    sprintStatusText = `🏁 **Sprint #${latestSprint.number}** (Ended)\n` +
                        `└ **Duration:** ${latestSprint.start_date} to ${latestSprint.end_date}\n` +
                        `└ Use \`/setup_sprint\` to start a new sprint.`;
                }
            }
        }

        const dailyTimeText = project.daily_time ? project.daily_time.substring(0, 5) : "N/A";
        const weekdaysText = project.weekdays ? project.weekdays.toUpperCase() : "N/A";
        const dailyPeriodText = project.daily_period ? `${project.daily_period} minute(s)` : "N/A";
        const timezoneText = project.timezone || "UTC";
        const channelText = project.channel_id ? `<#${project.channel_id}>` : "N/A";

        const sprintRepeatText = project.sprint_repeat ? "Enabled" : "Disabled";
        const sprintDurationText = project.sprint_duration ? `${project.sprint_duration} day(s)` : "N/A";

        const memberCount = members.length;
        const memberListText = members.length > 0
            ? members.map(m => `• <@${m.discord_id}> (${m.display_name})`).join("\n")
            : "No members registered. Tell your team to join using `/join_project`.";

        const embed = new EmbedBuilder()
            .setTitle(`💣 Project Config & Status: ${project.name}`)
            .setColor(0x0ea5e9)
            .setTimestamp()
            .addFields(
                { name: "🔑 Access Code", value: `\`${project.access_code}\``, inline: true },
                { name: "📢 Report Channel", value: channelText, inline: true },
                { name: "⏱️ Daily Schedule", value: `**Time:** ${dailyTimeText}\n**Days:** ${weekdaysText}\n**Open Window:** ${dailyPeriodText}\n**Timezone:** ${timezoneText}`, inline: false },
                { name: "🏃 Sprint Status", value: sprintStatusText, inline: false },
                { name: "🔁 Sprint Auto-Repeat", value: `**Auto-Repeat:** ${sprintRepeatText}\n**Default Duration:** ${sprintDurationText}`, inline: false },
                { name: `👥 Team Members (${memberCount})`, value: memberListText, inline: false }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};
