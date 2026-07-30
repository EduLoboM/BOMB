import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags
} from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { impedimentService } from "../services/impedimentService.js";
import type { ImpedimentWithDetails, Project, User } from "../types.js";
import {
    COLORS, ICONS, HEADERS, DIVIDERS,
    buildEmbed, statusBadge, memberLine, kvPair, codeBox,
    ansiBlock, ansiColor, ANSI
} from "../utils/theme.js";
import { CLASS_REGISTRY } from "../services/gamificationService.js";

export function buildLeaderViewEmbed(project: Project, impediments: ImpedimentWithDetails[], stats: {
    totalActive: number;
    inAssistance: number;
    resolved: number;
    maxBlockStreak: number;
    unassignedCount: number;
}): EmbedBuilder {
    const embed = buildEmbed({
        title: `🚧  ${project.name}  —  Painel de Obstáculos (Visão do Líder)`,
        description: [
            HEADERS.bomb,
            "",
            `👑 **Central de Comando de Impedimentos**`,
            `*Acompanhe e remova os obstáculos do seu time em tempo real.*`,
            "",
            ansiBlock([
                `${ansiColor("🔴 ATIVOS: " + stats.totalActive, ANSI.RED)}   ` +
                `${ansiColor("🟡 EM APOIO: " + stats.inAssistance, ANSI.YELLOW)}   ` +
                `${ansiColor("🟢 RESOLVIDOS: " + stats.resolved, ANSI.GREEN)}`,
                `${ansiColor("⚡ MAIOR BLOCK STREAK: " + stats.maxBlockStreak + " dia(s)", ANSI.CYAN)}   ` +
                `${ansiColor("⚠️ NÃO ATRIBUÍDOS: " + stats.unassignedCount, ANSI.RED)}`
            ]),
        ].join("\n"),
        color: stats.totalActive > 0 ? COLORS.danger : COLORS.success,
    });

    if (impediments.length === 0) {
        embed.addFields({
            name: `✨  Caminho Desimpedido`,
            value: `🎉 **Nenhum obstáculo ativo no projeto!**\nTodos os aventureiros estão avançando sem bloqueios.`
        });
        return embed;
    }

    let entriesText = "";
    impediments.slice(0, 10).forEach((imp, i) => {
        const u = imp.user;
        const classIcon = u?.character_class ? (CLASS_REGISTRY[u.character_class]?.icon || "⚔️") : "⚔️";
        const userMention = u?.discord_id ? `<@${u.discord_id}>` : (u?.display_name || "Membro");
        const streakBadge = imp.block_streak >= 2 ? `⚡ **${imp.block_streak} DIAS EM BLOCK STREAK!**` : `⚡ ${imp.block_streak} dia`;

        let statusText = "🔴 **Aguardando Ajuda**";
        if (imp.status === "in_assistance") {
            const helperMention = imp.helper?.discord_id ? `<@${imp.helper.discord_id}>` : (imp.helper?.display_name || "Aventureiro");
            statusText = `🟡 **Em Suporte com** ${helperMention}`;
        }

        const dateStr = new Date(imp.created_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        entriesText += [
            `**${i + 1}.** ${classIcon} ${userMention} *(${u?.display_name || "Desconhecido"})*  [${streakBadge}]`,
            `└─ 🚧 **Obstáculo:** *"${imp.description}"*`,
            `└─ 🛡️ **Status:** ${statusText} | 🕒 *Relatado em ${dateStr}*`,
            ""
        ].join("\n") + "\n";
    });

    embed.addFields({
        name: `🔥  Obstáculos em Aberto (${impediments.length})`,
        value: entriesText.length > 1024 ? entriesText.substring(0, 1020) + "..." : entriesText
    });

    return embed;
}

export function buildMemberViewEmbed(project: Project, currentUser: User, impediments: ImpedimentWithDetails[]): EmbedBuilder {
    const myActive = impediments.find(i => i.user_id === currentUser.id);
    const othersActive = impediments.filter(i => i.user_id !== currentUser.id);

    const embed = buildEmbed({
        title: `🛡️  ${project.name}  —  Painel de Obstáculos (Visão do Membro)`,
        description: [
            HEADERS.daily,
            "",
            `⚔️ **Central do Aventureiro**`,
            `*Gerencie seus bloqueios e ajude seus companheiros de guilda!*`,
        ].join("\n"),
        color: myActive ? COLORS.warning : COLORS.primary,
    });

    if (myActive) {
        const streakText = myActive.block_streak >= 2 ? `⚡ **Block Streak: ${myActive.block_streak} dias seguidos!**` : `⚡ Streak: ${myActive.block_streak} dia`;
        let supportText = "🔴 **Procurando Ajuda da Guilda**";
        if (myActive.status === "in_assistance") {
            const h = myActive.helper;
            const helperMention = h?.discord_id ? `<@${h.discord_id}>` : (h?.display_name || "Aventureiro");
            supportText = `🟡 **<@${myActive.helper?.discord_id || ''}> (${myActive.helper?.display_name || 'Companheiro'}) está te ajudando!**`;
        }

        embed.addFields({
            name: `🚧  Seu Obstáculo Ativo`,
            value: [
                `├─ 📝 **Descrição:** *"${myActive.description}"*`,
                `├─ ${streakText}`,
                `└─ 🛡️ **Status:** ${supportText}`,
                "",
                `💡 *Use os botões abaixo para marcar como resolvido assim que desbloquear!*`
            ].join("\n")
        });
    } else {
        embed.addFields({
            name: `🟢  Seu Status Atual`,
            value: `✅ **Você não possui nenhum obstáculo ativo!**\nSe surgir algum problema, clique no botão **Relatar Obstáculo** para avisar o time.`
        });
    }

    if (othersActive.length > 0) {
        let squadText = "";
        othersActive.slice(0, 5).forEach((imp, i) => {
            const u = imp.user;
            const icon = u?.character_class ? (CLASS_REGISTRY[u.character_class]?.icon || "⚔️") : "⚔️";
            const mention = u?.discord_id ? `<@${u.discord_id}>` : (u?.display_name || "Membro");
            const streak = imp.block_streak >= 2 ? `⚡ **${imp.block_streak}d streak**` : `⚡ ${imp.block_streak}d`;

            let hText = "⚠️ Precisa de ajuda!";
            if (imp.status === "in_assistance") {
                hText = `🤝 Em suporte por ${imp.helper?.display_name || 'Alguém'}`;
            }

            squadText += `• ${icon} ${mention}: *"${imp.description}"* (${streak}) — ${hText}\n`;
        });

        embed.addFields({
            name: `🤝  Companheiros que Precisam de Ajuda (${othersActive.length})`,
            value: squadText
        });
    } else {
        embed.addFields({
            name: `🛡️  Status da Guilda`,
            value: `✨ Nenhum outro companheiro está bloqueado no momento!`
        });
    }

    return embed;
}

export function buildDashboardActionRows(activeView: "leader" | "member", impediments: ImpedimentWithDetails[], currentUserId: string) {
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("blockers_view_leader")
            .setLabel("Visão do Líder")
            .setEmoji("👑")
            .setStyle(activeView === "leader" ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("blockers_view_member")
            .setLabel("Minha Visão")
            .setEmoji("👤")
            .setStyle(activeView === "member" ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("blockers_add_btn")
            .setLabel("Relatar Obstáculo")
            .setEmoji("➕")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId("blockers_offer_help_btn")
            .setLabel("Oferecer Ajuda")
            .setEmoji("🤝")
            .setStyle(ButtonStyle.Success)
            .setDisabled(impediments.length === 0),
        new ButtonBuilder()
            .setCustomId("blockers_resolve_btn")
            .setLabel("Resolver Obstáculo")
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success)
            .setDisabled(impediments.length === 0)
    );

    return [row1];
}

export const blockersCommand: Command = {
    name: "blockers",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: `${ICONS.error} Este comando só pode ser executado dentro de um servidor do Discord.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: `${ICONS.error} Nenhuma guilda foi fundada neste servidor ainda. Use \`/create_project\`.`,
            });
            return;
        }

        const viewOption = (interaction.options.getString("view") as "leader" | "member") || "leader";

        const { user } = await userService.getOrCreateUser(
            interaction.user.id,
            interaction.user.displayName || interaction.user.username
        );

        const [impediments, stats] = await Promise.all([
            impedimentService.getActiveImpediments(project.id),
            impedimentService.getProjectImpedimentStats(project.id),
        ]);

        const embed = viewOption === "member"
            ? buildMemberViewEmbed(project, user, impediments)
            : buildLeaderViewEmbed(project, impediments, stats);

        const components = buildDashboardActionRows(viewOption, impediments, user.id);

        await interaction.editReply({
            embeds: [embed],
            components
        });
    }
};
