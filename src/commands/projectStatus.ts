import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { sprintService } from "../services/sprintService.js";
import { dateUtils } from "../utils/dateUtils.js";
import {
    COLORS, ICONS, HEADERS, DIVIDERS,
    buildEmbed, progressBar, statusBadge,
    memberLine, sprintTimeline, kvPair, codeBox,
    sectionTitle
} from "../utils/theme.js";

export const projectStatus: Command = {
    name: "project_status",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: `${ICONS.error} This command can only be run inside a Discord server.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: `${ICONS.error} No project has been created for this server yet. Ask a project leader to run \`/create_project\`.`,
            });
            return;
        }

        const [members, sprints] = await Promise.all([
            userService.getProjectMembers(project.id),
            sprintService.getSprints(project.id),
        ]);

        // ─── Sprint Status ────────────────────────────────
        let sprintStatusText = `${ICONS.pending} No sprints configured`;
        let sprintColor: number = COLORS.neutral;

        if (sprints.length > 0) {
            const todayStr = dateUtils.getLocalDateString();
            const currentSprint = sprints.find(s => s.start_date <= todayStr && todayStr <= s.end_date);

            if (currentSprint) {
                const daysLeft = Math.ceil(
                    (new Date(currentSprint.end_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
                );
                const totalDays = Math.ceil(
                    (new Date(currentSprint.end_date).getTime() - new Date(currentSprint.start_date).getTime()) / (1000 * 60 * 60 * 24)
                );
                const elapsed = totalDays - daysLeft;

                sprintStatusText = [
                    `${statusBadge("Active", true)}  **Sprint #${currentSprint.number}**`,
                    "",
                    sprintTimeline(currentSprint.start_date, currentSprint.end_date, daysLeft),
                    "",
                    `\`${progressBar(elapsed, totalDays)}\``,
                ].join("\n");
                sprintColor = COLORS.sprint;
            } else {
                const upcomingSprint = sprints
                    .filter(s => s.start_date > todayStr)
                    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

                if (upcomingSprint) {
                    const daysUntil = Math.ceil(
                        (new Date(upcomingSprint.start_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    sprintStatusText = [
                        `${statusBadge("Upcoming", false)}  **Sprint #${upcomingSprint.number}**`,
                        "",
                        sprintTimeline(upcomingSprint.start_date, upcomingSprint.end_date),
                        `    ${ICONS.clock} Starts in **${daysUntil}** day(s)`,
                    ].join("\n");
                } else {
                    const latestSprint = sprints[0]!;
                    sprintStatusText = [
                        `${statusBadge("Ended", false)}  **Sprint #${latestSprint.number}**`,
                        "",
                        sprintTimeline(latestSprint.start_date, latestSprint.end_date),
                        `    ${ICONS.arrow} Use \`/setup_sprint\` to start a new sprint.`,
                    ].join("\n");
                }
            }
        }

        // ─── Schedule Info ────────────────────────────────
        const dailyTimeText = project.daily_time ? project.daily_time.substring(0, 5) : "N/A";
        const weekdaysText = project.weekdays ? project.weekdays.toUpperCase() : "N/A";
        const dailyPeriodText = project.daily_period ? `${project.daily_period} minute(s)` : "N/A";
        const timezoneText = project.timezone || "UTC";
        const channelText = project.channel_id ? `<#${project.channel_id}>` : "N/A";

        const sprintRepeatText = project.sprint_repeat ? statusBadge("Enabled", true) : statusBadge("Disabled", false);
        const sprintDurationText = project.sprint_duration ? `${project.sprint_duration} day(s)` : "N/A";

        // ─── Members ──────────────────────────────────────
        const memberCount = members.length;
        const memberListText = members.length > 0
            ? members.map((m, i) => memberLine(`<@${m.discord_id}>`, m.display_name, i === members.length - 1)).join("\n")
            : `${ICONS.pending} No members registered. Tell your team to join using \`/join_project\`.`;

        // ─── Build Embed ──────────────────────────────────
        const embed = buildEmbed({
            title: `${ICONS.bomb}  ${project.name}  ${ICONS.none}  Project Dashboard`,
            description: HEADERS.bomb,
            color: sprintColor,
        });

        embed.addFields(
            {
                name: `${ICONS.key}  Access Code`,
                value: `\`\`\`\n  ${project.access_code}\n\`\`\``,
                inline: true
            },
            {
                name: `${ICONS.channel}  Report Channel`,
                value: channelText,
                inline: true
            },
            {
                name: "\u200B",
                value: DIVIDERS.dotted,
                inline: false
            },
            {
                name: `${ICONS.clock}  Daily Schedule`,
                value: [
                    `├─ ${kvPair("Time", codeBox(dailyTimeText))}`,
                    `├─ ${kvPair("Days", codeBox(weekdaysText))}`,
                    `├─ ${kvPair("Window", codeBox(dailyPeriodText))}`,
                    `└─ ${kvPair("Timezone", codeBox(timezoneText))}`,
                ].join("\n"),
                inline: false
            },
            {
                name: `${ICONS.sprint}  Sprint Status`,
                value: sprintStatusText,
                inline: false
            },
            {
                name: `${ICONS.repeat}  Sprint Auto-Repeat`,
                value: [
                    `├─ ${kvPair("Auto-Repeat", sprintRepeatText)}`,
                    `└─ ${kvPair("Default Duration", codeBox(sprintDurationText))}`,
                ].join("\n"),
                inline: false
            },
            {
                name: "\u200B",
                value: DIVIDERS.dotted,
                inline: false
            },
            {
                name: `${ICONS.team}  Team Members (${memberCount})`,
                value: memberListText,
                inline: false
            }
        );

        await interaction.editReply({ embeds: [embed] });
    }
};
