import {
    Client,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalActionRowComponentBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    TextChannel,
    NewsChannel,
    Message
} from "discord.js";
import { Logger } from "../logger.js";
import { userService } from "../services/userService.js";
import { dailyService } from "../services/dailyService.js";
import { dateUtils } from "./dateUtils.js";
import type { Project, DailyWithUser } from "../types.js";
import {
    COLORS, ICONS, DIVIDERS, HEADERS,
    progressBar, treeItem, buildEmbed,
    sectionTitle, kvPair
} from "./theme.js";

/**
 * Formats a single submission entry for the daily report embed.
 * Extracted to eliminate duplication between the short and chunked paths.
 */
function formatSubmissionEntry(
    discordId: string,
    daily: DailyWithUser,
    branchChar: string,
    continueChar: string,
): string {
    const blockerText = daily.blockers && daily.blockers.trim()
        ? `${ICONS.blocker} ${daily.blockers}`
        : ICONS.none;

    return (
        `${branchChar}─ ${ICONS.user} **<@${discordId}>** *(${daily.users.display_name})*\n` +
        `${continueChar}  ${treeItem(`**Done:** ${daily.done}`)}` + "\n" +
        `${continueChar}  ${treeItem(`**Todo:** ${daily.todo}`)}` + "\n" +
        `${continueChar}  ${treeItem(`**Blockers:** ${blockerText}`, true)}` + "\n" +
        `${continueChar}\n`
    );
}

export const reportUtils = {
    async sendOrUpdateDailyReport(client: Client, project: Project, dateStr: string): Promise<void> {
        try {
            if (!project.channel_id) {
                Logger.warn(`No daily report channel configured for project ${project.name}`);
                return;
            }

            const members = await userService.getProjectMembers(project.id);
            if (members.length === 0) {
                Logger.warn(`No members found for project ${project.name}`);
                return;
            }

            const { start, end } = dateUtils.getLocalDayBoundaries(dateStr);
            const dailies = await dailyService.getDailiesForProjectToday(project.id, start, end);

            const dailyMap = new Map<string, DailyWithUser>();
            for (const daily of dailies) {
                if (daily.users) {
                    dailyMap.set(daily.users.discord_id, daily);
                }
            }

            const submittedUserIds = new Set(dailyMap.keys());
            const pendingMembers = members.filter(m => !submittedUserIds.has(m.discord_id));

            // ─── Build the embed ──────────────────────────────
            const completionBar = progressBar(dailyMap.size, members.length);

            const embed = buildEmbed({
                title: `${ICONS.bomb}  Daily Standup  ${ICONS.none}  ${dateStr}`,
                description: [
                    HEADERS.daily,
                    "",
                    `${ICONS.diamond} **Project:** ${project.name}`,
                    `${ICONS.arrow} Use \`/daily\` or click the button below to submit.`,
                    "",
                    `\`${completionBar}\``,
                ].join("\n"),
                color: COLORS.daily,
            });

            // ─── Submissions Section ──────────────────────────
            if (dailyMap.size > 0) {
                const totalEntries = dailyMap.size;

                // Build all entries using the shared formatter
                const entries: string[] = [];
                let entryIndex = 0;
                for (const [discordId, daily] of dailyMap.entries()) {
                    entryIndex++;
                    const isLast = entryIndex === totalEntries;
                    const branchChar = isLast ? "└" : "├";
                    const continueChar = isLast ? " " : "│";
                    entries.push(formatSubmissionEntry(discordId, daily, branchChar, continueChar));
                }

                const fullText = entries.join("");

                if (fullText.length > 1000) {
                    // Chunk entries into multiple fields to stay under Discord's 1024 char limit
                    let chunk = "";
                    let count = 1;

                    for (const entry of entries) {
                        if (chunk.length + entry.length > 1000) {
                            embed.addFields({
                                name: `${sectionTitle(ICONS.sparkle, `Submissions (Part ${count})`)}`,
                                value: chunk
                            });
                            chunk = entry;
                            count++;
                        } else {
                            chunk += entry;
                        }
                    }
                    if (chunk) {
                        embed.addFields({
                            name: `${ICONS.sparkle}  Submissions (${dailyMap.size}/${members.length})`,
                            value: chunk
                        });
                    }
                } else {
                    embed.addFields({
                        name: `${ICONS.sparkle}  Submissions (${dailyMap.size}/${members.length})`,
                        value: fullText
                    });
                }
            } else {
                embed.addFields({
                    name: `${ICONS.sparkle}  Submissions (0/${members.length})`,
                    value: `*${ICONS.pending} No submissions yet*`
                });
            }

            // ─── Pending Section ──────────────────────────────
            if (pendingMembers.length > 0) {
                const pendingMentions = pendingMembers.map(m => `<@${m.discord_id}>`).join(", ");
                embed.addFields({
                    name: `${ICONS.clock}  Pending`,
                    value: pendingMentions.length > 1020 ? pendingMentions.substring(0, 1020) + "..." : pendingMentions
                });
            } else {
                embed.addFields({
                    name: `${ICONS.clock}  Pending`,
                    value: `${ICONS.success} Everyone has submitted today!`
                });
            }

            // ─── Button ───────────────────────────────────────
            const button = new ButtonBuilder()
                .setCustomId("submit_daily_btn")
                .setLabel("  Submit Daily Report")
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

            // Use cache first, then fetch — avoids unnecessary API calls
            const channel = client.channels.cache.get(project.channel_id)
                ?? await client.channels.fetch(project.channel_id);

            if (!channel || !channel.isTextBased()) {
                Logger.warn(`Channel ${project.channel_id} is not sendable, not text-based, or not found.`);
                return;
            }

            const sendableChannel = channel as TextChannel | NewsChannel;
            const messages = await sendableChannel.messages.fetch({ limit: 50 });
            const titleMatch = `${ICONS.bomb}  Daily Standup  ${ICONS.none}  ${dateStr}`;
            const reportMsg: Message | undefined = messages.find((m: Message) =>
                m.author.id === client.user?.id &&
                m.embeds.length > 0 &&
                m.embeds[0]!.title === titleMatch
            );

            if (reportMsg) {
                await reportMsg.edit({ embeds: [embed], components: [row] });
            } else {
                await sendableChannel.send({ embeds: [embed], components: [row] });
            }
        } catch (err) {
            Logger.error(`Failed to update daily report for project ${project.name}:`, err);
        }
    },

    async showDailyModal(interaction: ButtonInteraction | ChatInputCommandInteraction): Promise<void> {
        const modal = new ModalBuilder()
            .setCustomId("daily_modal")
            .setTitle(`${ICONS.bomb} Daily Standup Report`);

        const doneInput = new TextInputBuilder()
            .setCustomId("done")
            .setLabel("What did you do yesterday?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder("e.g. Worked on database queries, styled the header...");

        const todoInput = new TextInputBuilder()
            .setCustomId("todo")
            .setLabel("What will you do today?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder("e.g. Integrate auth endpoints, write unit tests...");

        const blockersInput = new TextInputBuilder()
            .setCustomId("blockers")
            .setLabel("Any blockers?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setPlaceholder("e.g. None / waiting on design assets...");

        const row1 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(doneInput);
        const row2 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(todoInput);
        const row3 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(blockersInput);

        modal.addComponents(row1, row2, row3);
        await interaction.showModal(modal);
    },

    isDailyOpen(project: Project): boolean {
        if (!project.daily_time || !project.weekdays || project.daily_period === null || project.daily_period === undefined) {
            return true;
        }

        const timezone = project.timezone || "UTC";
        const now = new Date();
        const tzInfo = dateUtils.getDateTimeInTimezone(now, timezone);

        const [startH, startM] = project.daily_time.split(":").map(Number);
        const startMinutes = (startH ?? 0) * 60 + (startM ?? 0);

        const [currentH, currentM] = tzInfo.time.split(":").map(Number);
        const currentMinutes = (currentH ?? 0) * 60 + (currentM ?? 0);

        const endMinutes = startMinutes + project.daily_period;
        const weekdays = project.weekdays.split(",").map((d: string) => d.trim().toLowerCase());

        if (endMinutes <= 1440) {
            // Window is entirely on the same day
            if (!weekdays.includes(tzInfo.weekday)) {
                return false;
            }
            return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        } else {
            // Window spans across midnight
            // If we are before the daily start time today, we might be in yesterday's window
            if (currentMinutes < startMinutes) {
                // We are in the post-midnight window of yesterday's daily.
                // We need to check if yesterday was a scheduled day.
                const yesterdayDate = new Date(now);
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterdayTzInfo = dateUtils.getDateTimeInTimezone(yesterdayDate, timezone);

                if (!weekdays.includes(yesterdayTzInfo.weekday)) {
                    return false;
                }
                return currentMinutes <= (endMinutes - 1440);
            } else {
                // We are in today's window (after daily_time, before midnight)
                if (!weekdays.includes(tzInfo.weekday)) {
                    return false;
                }
                return true;
            }
        }
    }
};
