import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { COLORS, ICONS, buildEmbed, statusBadge } from "../utils/theme.js";

export const setupRolesCommand: Command = {
    name: "setup_roles",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: `${ICONS.error} Este comando só pode ser executado dentro de um servidor do Discord.` });
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return void await interaction.reply({ content: `${ICONS.error} Apenas administradores do servidor podem configurar as recompensas RPG.` });
        await interaction.deferReply();

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) return void await interaction.editReply({ content: `${ICONS.error} Nenhuma guilda encontrada neste servidor.` });

        const autoRoles = interaction.options.getBoolean("auto_roles");
        const gamification = interaction.options.getBoolean("gamification");

        if (autoRoles !== null) await projectService.updateAutoRoles(project.id, autoRoles);
        if (gamification !== null) await projectService.updateGamification(project.id, gamification);

        const updated = await projectService.getProjectByGuild(interaction.guildId);
        const embed = buildEmbed({
            title: "🔮  Configurações RPG & Recompensas",
            description: [
                `${ICONS.success} Configurações de gamificação atualizadas com sucesso!`, "",
                `• **Sistema de Gamificação**: ${statusBadge("Ativado", updated?.gamification_enabled !== false)}`,
                `• **Cargos Automáticos do Discord**: ${statusBadge("Ativado", !!updated?.auto_roles)}`, "",
                `${ICONS.sparkle} *Quando os Cargos Automáticos estão ativados, o BOMB criará e atribuirá cargos no servidor correspondentes às classes dos aventureiros!*`
            ].join("\n"),
            color: COLORS.sprint,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
