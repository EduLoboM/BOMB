import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { createClassSelectRow } from "../services/gamificationService.js";
import {
    COLORS, ICONS, HEADERS,
    buildEmbed, errorMsg, infoMsg
} from "../utils/theme.js";

export const joinProject: Command = {
    name: "join_project",

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const accessCode = interaction.options.getString("code", true).trim().toUpperCase();

        const project = await projectService.getProjectByAccessCode(accessCode);
        if (!project) {
            await interaction.editReply({
                content: errorMsg("Pergaminho de acesso inválido! Verifique o código de convite e tente novamente."),
            });
            return;
        }

        const displayName = interaction.member && "displayName" in interaction.member && interaction.member.displayName
            ? (interaction.member.displayName as string)
            : interaction.user.username;

        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        const isAlreadyMember = await userService.isMemberOfProject(user.id, project.id);
        if (isAlreadyMember) {
            await interaction.editReply({
                content: infoMsg(`Você já é um aventureiro da guilda **${project.name}**!`),
            });
            return;
        }

        await userService.addMemberToProject(user.id, project.id);

        const embed = buildEmbed({
            title: `⚔️  Novo Aventureiro na Guilda!`,
            description: [
                HEADERS.welcome,
                "",
                `⚔️ **${displayName}** cruzou os portões da guilda **${project.name}**!`,
                "",
                `${ICONS.arrow} Envie seus relatórios de expedição com \`/daily\``,
                `${ICONS.arrow} Veja o painel da guilda com \`/project_status\``,
                `${ICONS.arrow} Confira seu perfil de aventureiro com \`/profile\``,
                "",
                `🛡️ **Escolha sua Classe de Aventureiro abaixo para ganhar poderes passivos!**`,
            ].join("\n"),
            color: COLORS.success,
            author: {
                name: `Bem-vindo à aventura, ${displayName}!`,
                iconURL: interaction.user.displayAvatarURL(),
            },
        });

        const selectRow = createClassSelectRow(user);

        await interaction.editReply({ embeds: [embed], components: [selectRow] });
    }
};
