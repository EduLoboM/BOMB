import { Interaction, MessageFlags, GuildMember } from "discord.js";
import { Logger } from "../logger.js";
import { commands } from "../commands/index.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { dailyService } from "../services/dailyService.js";
import { dateUtils } from "../utils/dateUtils.js";
import { reportUtils } from "../utils/reportUtils.js";
import { ICONS, COLORS, HEADERS, buildEmbed, errorMsg, successMsg, warningMsg } from "../utils/theme.js";

export async function handleInteraction(interaction: Interaction) {
    try {
        if (interaction.isChatInputCommand()) {
            const command = commands.get(interaction.commandName);
            if (command) {
                Logger.info(`Command "/${interaction.commandName}" executed by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);
                await command.execute(interaction, interaction.client);
            }
            return;
        }

        if (interaction.isStringSelectMenu() && interaction.customId === "class_select_menu") {
            Logger.info(`Select Menu "class_select_menu" selected by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const selectedClass = interaction.values[0];
            if (!selectedClass) return;

            const displayName = interaction.user.displayName || interaction.user.username;
            const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

            const { gamificationService, CLASS_REGISTRY } = await import("../services/gamificationService.js");
            const classDef = CLASS_REGISTRY[selectedClass];

            if (!classDef) {
                await interaction.editReply({ content: errorMsg("Classe inválida.") });
                return;
            }

            const oldClass = user.character_class;
            await gamificationService.changeUserClass(user, selectedClass);

            if (interaction.guild && interaction.member) {
                const project = await projectService.getProjectByGuild(interaction.guildId!);
                if (project && project.auto_roles) {
                    await gamificationService.syncUserRole(interaction.guild, interaction.member as GuildMember, selectedClass);
                }
            }

            const isBaseClass = classDef.tier === 1;
            let msgText = successMsg(`Sua classe foi definida para ${classDef.icon} **${classDef.name}**!\n\n⚡ **Passiva:** ${classDef.passiveInfo}`);

            if (isBaseClass && oldClass && oldClass !== selectedClass) {
                msgText += `\n\n💡 *Ao trocar para uma classe base, você mantém seu Nível (${user.level ?? 1}) e XP, mas precisará avançar de nível a partir de agora para destravar evoluções futuras nesta nova rota!*`;
            }

            await interaction.editReply({ content: msgText });
            return;
        }

        if (interaction.isButton() && interaction.customId === "submit_daily_btn") {
            Logger.info(`Button "submit_daily_btn" clicked by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);

            if (!interaction.guildId) {
                await interaction.reply({
                    content: errorMsg("Este botão só pode ser clicado dentro de um servidor do Discord."),
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const project = await projectService.getProjectByGuild(interaction.guildId);
            if (!project) {
                await interaction.reply({
                    content: errorMsg("Nenhuma guilda existe neste servidor."),
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const member = await userService.getMember(interaction.user.id, project.id);
            if (!member) {
                await interaction.reply({
                    content: errorMsg("Você não é um aventureiro desta guilda. Entre usando `/join_project` com o código de acesso."),
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const isOpen = reportUtils.isDailyOpen(project);
            if (!isOpen) {
                const dailyTime = project.daily_time ? project.daily_time.substring(0, 5) : "N/A";
                const period = project.daily_period ? `${project.daily_period}m` : "N/A";
                await interaction.reply({
                    content: errorMsg(`O portal de submissão está fechado! ⏰ Ele só abre por ${period} a partir das ${dailyTime}.`),
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            await reportUtils.showDailyModal(interaction);
            return;
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith("finish_project_modal_")) {
            Logger.info(`Modal "finish_project_modal_" submitted by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);

            await interaction.deferReply();

            const projectId = interaction.customId.replace("finish_project_modal_", "");
            const description = interaction.fields.getTextInputValue("description").trim();
            const rawIcon = interaction.fields.getTextInputValue("icon").trim();
            const badgeIcon = rawIcon || "🏆";

            const project = await projectService.getProjectByGuild(interaction.guildId!);
            const projectName = project ? project.name : "Guilda Aventureira";
            const members = await userService.getProjectMembers(projectId);
            for (const member of members) {
                await userService.awardBadge(member.id, projectName, description, badgeIcon);
            }
            await projectService.deleteProject(projectId);

            const embed = buildEmbed({
                title: `🎉  Expedição Concluída com Sucesso!`,
                description: [
                    HEADERS.victory,
                    "",
                    `A guilda **${projectName}** completou sua missão épica!`,
                    "",
                    `🏆 **Troféu Concedido aos Aventureiros (${members.length}):**`,
                    `${badgeIcon} **${projectName}** — *"${description}"*`,
                    "",
                    `${ICONS.sparkle} *Esta conquista foi gravada permanentemente no perfil (\`/profile\`) de todos os participantes!*`,
                ].join("\n"),
                color: COLORS.legendary,
            });

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        if (interaction.isModalSubmit() && interaction.customId === "daily_modal") {
            Logger.info(`Modal "daily_modal" submitted by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);

            if (!interaction.guildId) {
                await interaction.reply({
                    content: errorMsg("Este modal só pode ser enviado dentro de um servidor do Discord."),
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const done = interaction.fields.getTextInputValue("done").trim();
            const todo = interaction.fields.getTextInputValue("todo").trim();
            const blockers = interaction.fields.getTextInputValue("blockers").trim() || "None";

            const project = await projectService.getProjectByGuild(interaction.guildId);
            if (!project) {
                await interaction.editReply({
                    content: errorMsg("Guilda não encontrada."),
                });
                return;
            }

            const member = await userService.getMember(interaction.user.id, project.id);
            if (!member) {
                await interaction.editReply({
                    content: errorMsg("Aventureiro não encontrado."),
                });
                return;
            }

            const todayStr = dateUtils.getLocalDateString();
            const { start, end } = dateUtils.getLocalDayBoundaries(todayStr);

            const existingDaily = await dailyService.getDailyForUserToday(member.id, project.id, start, end);
            const todayDailies = await dailyService.getDailiesForProjectToday(project.id, start, end);
            const isFirstSubmissionToday = todayDailies.length <= 1;
            const hasNoBlockers = blockers.toLowerCase() === "none" || blockers.trim() === "";

            if (existingDaily) {
                await dailyService.updateDaily(existingDaily.id, done, todo, blockers);
            } else {
                await dailyService.createDaily(member.id, project.id, done, todo, blockers);
            }

            let responseText = successMsg("Relatório de expedição enviado com sucesso! 📜");
            if (project.gamification_enabled !== false) {
                const { gamificationService, CLASS_REGISTRY } = await import("../services/gamificationService.js");
                const xpResult = await gamificationService.processDailySubmission(
                    member,
                    project,
                    isFirstSubmissionToday,
                    hasNoBlockers,
                    done,
                    todo
                );

                const currentClass = CLASS_REGISTRY[xpResult.oldClass] || { name: xpResult.oldClass, icon: "🛡️" };

                responseText += `\n\n🌟 **+${xpResult.xpGained} XP Ganho!** (Base: ${xpResult.baseXP} | Streak: 🔥 ${xpResult.newStreak} dias (+${xpResult.streakBonus} XP))`;

                if (xpResult.passiveNotes.length > 0) {
                    responseText += `\n   ${xpResult.passiveNotes.join(" | ")}`;
                }

                if (xpResult.leveledUp) {
                    responseText += `\n\n✨🎉 **LEVEL UP!** Você alcançou o **Nível ${xpResult.newLevel}**! 🎉✨`;
                }

                if (xpResult.availableEvolutions.length > 0) {
                    responseText += `\n⚡🔮 **EVOLUÇÃO DESBLOQUEADA!** Use \`/class\` para evoluir para: ${xpResult.availableEvolutions.map(e => `**${e}**`).join(" ou ")}!`;
                }

                if (project.auto_roles && interaction.guild && interaction.member) {
                    await gamificationService.syncUserRole(interaction.guild, interaction.member as GuildMember, member.character_class || "Gobbo");
                }
            }

            if (!project.channel_id) {
                responseText += `\n${warningMsg("*Nenhum canal de relatórios foi configurado ainda. Peça a um líder para usar `/setup_channel` para ativar o painel de expedição.*")}`;
            }

            await interaction.editReply({ content: responseText });

            if (project.channel_id) {
                await reportUtils.sendOrUpdateDailyReport(interaction.client, project, todayStr);
            }
            return;
        }
    } catch (error: unknown) {
        Logger.error(`Error processing action for user \x1b[1m${interaction.user.tag}\x1b[0m`, error);

        if (!interaction.isRepliable()) {
            return;
        }

        const errorMessage = error && typeof error === "object" && "message" in error && typeof error.message === "string"
            ? errorMsg(`Erro: ${error.message}`)
            : errorMsg("Erro ao processar esta ação.");

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ content: errorMessage }).catch(console.error);
        } else {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral }).catch(console.error);
        }
    }
}
