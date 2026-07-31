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
import { t, Language } from "../i18n/index.js";

function formatSubmissionEntry(
    discordId: string,
    daily: DailyWithUser,
    branchChar: string,
    continueChar: string,
    lang: Language = "pt"
): string {
    const blockerText = daily.blockers?.trim() ? `🚧 ${daily.blockers}` : "—";
    const userClass = daily.users.character_class || "Gobbo";
    const classIcon = CLASS_REGISTRY[userClass]?.icon || "🍀";
    const level = daily.users.level ?? 1;
    const streak = daily.users.streak ?? 0;
    const userBadge = `[${classIcon} ${userClass} Lv ${level}${streak > 0 ? ` | 🔥 ${streak}` : ""}]`;

    return `${branchChar}─ ⚔️ **<@${discordId}>** *(${daily.users.display_name})* \`${userBadge}\`\n` +
        `${continueChar}  ${treeItem(`✅ **${t("daily.done", lang)}:** ${daily.done}`)}\n` +
        `${continueChar}  ${treeItem(`📋 **${t("daily.todo", lang)}:** ${daily.todo}`)}\n` +
        `${continueChar}  ${treeItem(`🚧 **${t("daily.blockers", lang)}:** ${blockerText}`, true)}\n` +
        `${continueChar}\n`;
}

export const reportUtils = {
    async sendOrUpdateDailyReport(client: Client, project: Project, dateStr: string): Promise<void> {
        try {
            if (!project.channel_id) return Logger.warn(`No daily report channel configured for project ${project.name}`);
            const members = await userService.getProjectMembers(project.id);
            if (members.length === 0) return Logger.warn(`No members found for project ${project.name}`);

            const { start, end } = dateUtils.getLocalDayBoundaries(dateStr);
            const dailies = await dailyService.getDailiesForProjectToday(project.id, start, end);

            const dailyMap = new Map<string, DailyWithUser>();
            dailies.forEach(d => { if (d.users) dailyMap.set(d.users.discord_id, d); });

            const lang: Language = (project.language as Language) || "pt";
            const pending = members.filter(m => !dailyMap.has(m.discord_id));

            const embed = buildEmbed({
                title: t("daily.journalTitle", lang, { date: dateStr }),
                description: [HEADERS.daily, "", `🏰 **${t("common.guild", lang)}:** ${project.name}`, `${ICONS.arrow} ${t("daily.prompt", lang)}`, "", ansiBlock([ansiProgressBar(dailyMap.size, members.length)])].join("\n"),
                color: COLORS.daily,
            });

            if (dailyMap.size > 0) {
                const total = dailyMap.size;
                const entries = Array.from(dailyMap.entries()).map(([id, daily], idx) => {
                    const isLast = idx === total - 1;
                    return formatSubmissionEntry(id, daily, isLast ? "└" : "├", isLast ? " " : "│", lang);
                });
                const fullText = entries.join("");
                if (fullText.length > 1000) {
                    let chunk = "", count = 1;
                    for (const entry of entries) {
                        if (chunk.length + entry.length > 1000) {
                            embed.addFields({ name: sectionTitle(ICONS.sparkle, `Relatórios (Parte ${count})`), value: chunk });
                            chunk = entry;
                            count++;
                        } else chunk += entry;
                    }
                    if (chunk) embed.addFields({ name: `✨  Relatórios de Expedição (${dailyMap.size}/${members.length})`, value: chunk });
                } else {
                    embed.addFields({ name: `✨  Relatórios de Expedição (${dailyMap.size}/${members.length})`, value: fullText });
                }
            } else {
                embed.addFields({ name: `✨  Relatórios de Expedição (0/${members.length})`, value: "*⏳ ...*" });
            }

            if (pending.length > 0) {
                const mentions = pending.map(m => `<@${m.discord_id}>`).join(", ");
                embed.addFields({ name: t("daily.pendingMembers", lang, { count: pending.length }), value: mentions.length > 1020 ? mentions.substring(0, 1020) + "..." : mentions });
            } else {
                embed.addFields({ name: t("daily.pendingMembers", lang, { count: 0 }), value: t("daily.allSubmitted", lang) });
            }

            const button = new ButtonBuilder().setCustomId("submit_daily_btn").setLabel(t("daily.submitButton", lang)).setEmoji("📜").setStyle(ButtonStyle.Success);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

            const channel = client.channels.cache.get(project.channel_id) ?? await client.channels.fetch(project.channel_id);
            if (!channel?.isTextBased()) return Logger.warn(`Channel ${project.channel_id} is not sendable, not text-based, or not found.`);

            const sendableChannel = channel as TextChannel | NewsChannel;
            const messages = await sendableChannel.messages.fetch({ limit: 50 });
            const titleMatch = t("daily.journalTitle", lang, { date: dateStr });
            const reportMsg = messages.find((m: Message) => m.author.id === client.user?.id && m.embeds.length > 0 && m.embeds[0]!.title === titleMatch);

            if (reportMsg) await reportMsg.edit({ embeds: [embed], components: [row] });
            else await sendableChannel.send({ embeds: [embed], components: [row] });
        } catch (err) {
            Logger.error(`Failed to update daily report for project ${project.name}:`, err);
        }
    },

    async showDailyModal(interaction: ButtonInteraction | ChatInputCommandInteraction, lang: Language = "pt"): Promise<void> {
        const createInput = (id: string, labelKey: string, req: boolean) =>
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder().setCustomId(id).setLabel(t(labelKey, lang)).setStyle(TextInputStyle.Paragraph).setRequired(req)
            );

        const modal = new ModalBuilder()
            .setCustomId("daily_modal")
            .setTitle(t("daily.modalTitle", lang))
            .addComponents(
                createInput("done", "daily.modalDoneLabel", true),
                createInput("todo", "daily.modalTodoLabel", true),
                createInput("blockers", "daily.modalBlockersLabel", false)
            );

        await interaction.showModal(modal);
    },

    isDailyOpen(project: Project): boolean {
        if (!project.daily_time || !project.weekdays || project.daily_period == null) return true;

        const timezone = project.timezone || "UTC";
        const now = new Date();
        const tzInfo = dateUtils.getDateTimeInTimezone(now, timezone);

        const parseMinutes = (timeStr: string) => {
            const [h, m] = timeStr.split(":").map(Number);
            return (h ?? 0) * 60 + (m ?? 0);
        };

        const startMinutes = parseMinutes(project.daily_time);
        const currentMinutes = parseMinutes(tzInfo.time);
        const endMinutes = startMinutes + project.daily_period;
        const weekdays = project.weekdays.split(",").map(d => d.trim().toLowerCase());

        if (endMinutes <= 1440) {
            return weekdays.includes(tzInfo.weekday) && currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        }

        if (currentMinutes < startMinutes) {
            const yesterdayDate = new Date(now);
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayTzInfo = dateUtils.getDateTimeInTimezone(yesterdayDate, timezone);
            return weekdays.includes(yesterdayTzInfo.weekday) && currentMinutes <= (endMinutes - 1440);
        }

        return weekdays.includes(tzInfo.weekday);
    },

    async sendBlockerNotification(
        client: Client,
        project: Project,
        discordId: string,
        displayName: string,
        blockerText: string,
        blockStreak: number,
        impedimentId?: string
    ): Promise<void> {
        try {
            if (!project.channel_id) return;
            const channel = client.channels.cache.get(project.channel_id) ?? await client.channels.fetch(project.channel_id);
            if (!channel?.isTextBased()) return;

            const isStreakAlert = blockStreak >= 2;
            const title = isStreakAlert
                ? `🚨  ALERTA DE BLOCK STREAK — GUILDA ${project.name}  🚨`
                : `🚧  ALERTA DE OBSTÁCULO — GUILDA ${project.name}`;

            const description = isStreakAlert
                ? `⚠️ <@${discordId}> (*${displayName}*) está em **BLOCK STREAK DE ${blockStreak} DIAS SEGUIDOS!**\n\n🚧 **Impedimento:** *"${blockerText}"*\n\n👑 **Líderes e Desenvolvedores:** Ofereçam suporte para desobstruir o caminho do projeto!\n Use \`/blockers\` para ver o painel completo ou clique nos botões abaixo.`
                : `⚔️ <@${discordId}> (*${displayName}*) relatou um novo obstáculo:\n\n🚧 **Obstáculo:** *"${blockerText}"*\n⚡ **Streak de Obstáculo:** ${blockStreak} dia\n\n🤝 *Desenvolvedores e companheiros de guilda: Ofereçam suporte!*`;

            const embed = buildEmbed({ title, description, color: isStreakAlert ? COLORS.danger : COLORS.warning });
            const row = impedimentId ? new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(`streak_help_btn_${impedimentId}`).setLabel("Oferecer Ajuda").setEmoji("🤝").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`streak_resolve_btn_${impedimentId}`).setLabel("Marcar Resolvido").setEmoji("✅").setStyle(ButtonStyle.Primary)
            ) : null;

            await (channel as TextChannel | NewsChannel).send({
                embeds: [embed],
                components: row ? [row] : []
            });
        } catch (err) {
            Logger.error(`Failed to send blocker notification for user ${discordId}:`, err);
        }
    }
};


