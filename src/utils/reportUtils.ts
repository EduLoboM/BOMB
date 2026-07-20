import {
    Client,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalActionRowComponentBuilder
} from "discord.js";
import { Logger } from "../logger.js";
import { userService } from "../services/userService.js";
import { dailyService } from "../services/dailyService.js";
import { dateUtils } from "./dateUtils.js";

export const reportUtils = {
    async sendOrUpdateDailyReport(client: Client, project: any, dateStr: string) {
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

            const dailyMap = new Map();
            for (const daily of dailies) {
                if (daily.users) {
                    dailyMap.set(daily.users.discord_id, daily);
                }
            }

            const submittedUserIds = new Set(dailyMap.keys());
            const pendingMembers = members.filter(m => !submittedUserIds.has(m.discord_id));

            const embed = new EmbedBuilder()
                .setTitle(`💣 Daily Standup - ${dateStr}`)
                .setDescription(`Project: **${project.name}**\nUse \`/daily\` or click the button below to submit your update.`)
                .setColor(0x4f46e5)
                .setTimestamp();

            if (dailyMap.size > 0) {
                let submissionText = "";
                for (const [discordId, daily] of dailyMap.entries()) {
                    submissionText += `👤 **<@${discordId}>** (${daily.users.display_name})\n`;
                    submissionText += `└ **Done:** ${daily.done}\n`;
                    submissionText += `└ **Todo:** ${daily.todo}\n`;
                    submissionText += `└ **Blockers:** ${daily.blockers && daily.blockers.trim() ? `⚠️ ${daily.blockers}` : "None"}\n\n`;
                }

                if (submissionText.length > 1000) {
                    let chunk = "";
                    let count = 1;
                    for (const [discordId, daily] of dailyMap.entries()) {
                        const entry = `👤 **<@${discordId}>** (${daily.users.display_name})\n└ **Done:** ${daily.done}\n└ **Todo:** ${daily.todo}\n└ **Blockers:** ${daily.blockers && daily.blockers.trim() ? `⚠️ ${daily.blockers}` : "None"}\n\n`;
                        if (chunk.length + entry.length > 1000) {
                            embed.addFields({ name: `📝 Submissions (Part ${count})`, value: chunk });
                            chunk = entry;
                            count++;
                        } else {
                            chunk += entry;
                        }
                    }
                    if (chunk) {
                        embed.addFields({ name: `📝 Submissions (${dailyMap.size}/${members.length})`, value: chunk });
                    }
                } else {
                    embed.addFields({ name: `📝 Submissions (${dailyMap.size}/${members.length})`, value: submissionText });
                }
            } else {
                embed.addFields({ name: `📝 Submissions (0/${members.length})`, value: "*(No submissions yet)*" });
            }

            if (pendingMembers.length > 0) {
                const pendingMentions = pendingMembers.map(m => `<@${m.discord_id}>`).join(", ");
                embed.addFields({
                    name: "⏳ Pending",
                    value: pendingMentions.length > 1020 ? pendingMentions.substring(0, 1020) + "..." : pendingMentions
                });
            } else {
                embed.addFields({
                    name: "⏳ Pending",
                    value: "🎉 Everyone has submitted today!"
                });
            }

            const button = new ButtonBuilder()
                .setCustomId("submit_daily_btn")
                .setLabel("Submit Daily Report")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("📝");

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

            const channel = await client.channels.fetch(project.channel_id);
            if (!channel || !channel.isTextBased() || typeof (channel as any).send !== "function") {
                Logger.warn(`Channel ${project.channel_id} is not sendable, not text-based, or not found.`);
                return;
            }

            const messages = await (channel as any).messages.fetch({ limit: 50 });
            const reportMsg = messages.find((m: any) => 
                m.author.id === client.user?.id && 
                m.embeds.length > 0 && 
                m.embeds[0].title === `💣 Daily Standup - ${dateStr}`
            );

            if (reportMsg) {
                await reportMsg.edit({ embeds: [embed], components: [row] });
            } else {
                await (channel as any).send({ embeds: [embed], components: [row] });
            }
        } catch (err) {
            Logger.error(`Failed to update daily report for project ${project.name}:`, err);
        }
    },

    async showDailyModal(interaction: any) {
        const modal = new ModalBuilder()
            .setCustomId("daily_modal")
            .setTitle("Daily Standup Report");

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
    }
};
