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
    sectionTitle, kvPair,
    ansiBlock, ansiProgressBar
} from "./theme.js";

import { CLASS_REGISTRY } from "../services/gamificationService.js";

function formatSubmissionEntry(
    discordId: string,
    daily: DailyWithUser,
    branchChar: string,
    continueChar: string,
): string {
    const blockerText = daily.blockers && daily.blockers.trim()
        ? `🚧 ${daily.blockers}`
        : "—";

    const userClass = daily.users.character_class || "Gobbo";
    const classIcon = CLASS_REGISTRY[userClass]?.icon || "🍀";
    const level = daily.users.level ?? 1;
    const streak = daily.users.streak ?? 0;
    const streakBadge = streak > 0 ? `🔥 ${streak}` : "";

    const userBadge = `[${classIcon} ${userClass} Lv ${level}${streakBadge ? ` | ${streakBadge}` : ""}]`;

    return (
        `${branchChar}─ ⚔️ **<@${discordId}>** *(${daily.users.display_name})* \`${userBadge}\`\n` +
        `${continueChar}  ${treeItem(`✅ **Feito:** ${daily.done}`)}` + "\n" +
        `${continueChar}  ${treeItem(`📋 **A Fazer:** ${daily.todo}`)}` + "\n" +
        `${continueChar}  ${treeItem(`🚧 **Obstáculos:** ${blockerText}`, true)}` + "\n" +
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
            const completionBar = progressBar(dailyMap.size, members.length);

            const embed = buildEmbed({
                title: `📜  Diário da Expedição  —  ${dateStr}`,
                description: [
                    HEADERS.daily,
                    "",
                    `🏰 **Guilda:** ${project.name}`,
                    `${ICONS.arrow} Use \`/daily\` ou clique no botão abaixo para enviar seu relatório.`,
                    "",
                    ansiBlock([ansiProgressBar(dailyMap.size, members.length)]),
                ].join("\n"),
                color: COLORS.daily,
            });
            if (dailyMap.size > 0) {
                const totalEntries = dailyMap.size;
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

                    let chunk = "";
                    let count = 1;

                    for (const entry of entries) {
                        if (chunk.length + entry.length > 1000) {
                            embed.addFields({
                                name: `${sectionTitle(ICONS.sparkle, `Relatórios (Parte ${count})`)}`,
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
                            name: `✨  Relatórios de Expedição (${dailyMap.size}/${members.length})`,
                            value: chunk
                        });
                    }
                } else {
                    embed.addFields({
                        name: `✨  Relatórios de Expedição (${dailyMap.size}/${members.length})`,
                        value: fullText
                    });
                }
            } else {
                embed.addFields({
                    name: `✨  Relatórios de Expedição (0/${members.length})`,
                    value: `*⏳ Nenhum relatório enviado ainda...*`
                });
            }
            if (pendingMembers.length > 0) {
                const pendingMentions = pendingMembers.map(m => `<@${m.discord_id}>`).join(", ");
                embed.addFields({
                    name: `⏳  Aventureiros Pendentes`,
                    value: pendingMentions.length > 1020 ? pendingMentions.substring(0, 1020) + "..." : pendingMentions
                });
            } else {
                embed.addFields({
                    name: `⏳  Aventureiros Pendentes`,
                    value: `✅ Todos os aventureiros reportaram hoje! 🎉`
                });
            }
            const button = new ButtonBuilder()
                .setCustomId("submit_daily_btn")
                .setLabel("Enviar Relatório da Expedição")
                .setEmoji("📜")
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
            const channel = client.channels.cache.get(project.channel_id)
                ?? await client.channels.fetch(project.channel_id);

            if (!channel || !channel.isTextBased()) {
                Logger.warn(`Channel ${project.channel_id} is not sendable, not text-based, or not found.`);
                return;
            }

            const sendableChannel = channel as TextChannel | NewsChannel;
            const messages = await sendableChannel.messages.fetch({ limit: 50 });
            const titleMatch = `📜  Diário da Expedição  —  ${dateStr}`;
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
            .setTitle("📜 Relatório de Expedição");

        const doneInput = new TextInputBuilder()
            .setCustomId("done")
            .setLabel("Quais missões você completou?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder("Ex: Derrotei os bugs do banco de dados, estilizei o header...");

        const todoInput = new TextInputBuilder()
            .setCustomId("todo")
            .setLabel("Quais serão suas próximas missões?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder("Ex: Integrar endpoints de auth, escrever testes...");

        const blockersInput = new TextInputBuilder()
            .setCustomId("blockers")
            .setLabel("Algum obstáculo no caminho?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setPlaceholder("Ex: Nenhum / Esperando assets de design do mago...");

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

            if (!weekdays.includes(tzInfo.weekday)) {
                return false;
            }
            return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        } else {
            if (currentMinutes < startMinutes) {
                const yesterdayDate = new Date(now);
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterdayTzInfo = dateUtils.getDateTimeInTimezone(yesterdayDate, timezone);

                if (!weekdays.includes(yesterdayTzInfo.weekday)) {
                    return false;
                }
                return currentMinutes <= (endMinutes - 1440);
            } else {

                if (!weekdays.includes(tzInfo.weekday)) {
                    return false;
                }
                return true;
            }
        }
    }
};
