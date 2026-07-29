import { randomBytes } from "node:crypto";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { Logger } from "../logger.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import {
    COLORS, ICONS, HEADERS,
    buildEmbed, questBox, errorMsg
} from "../utils/theme.js";
function generateAccessCode(length = 6): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = randomBytes(length);
    return Array.from(bytes, b => chars[b % chars.length]).join("");
}

export const createProject: Command = {
    name: "create_project",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const projectName = interaction.options.getString("name", true);

        const existingProject = await projectService.getProjectByGuild(interaction.guildId);
        if (existingProject) {
            await interaction.editReply({
                content: errorMsg(`A guilda **${existingProject.name}** já existe neste servidor! Apenas uma guilda pode ser criada por servidor.`),
            });
            return;
        }

        let accessCode = generateAccessCode();
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            const project = await projectService.getProjectByAccessCode(accessCode);
            if (!project) {
                isUnique = true;
            } else {
                accessCode = generateAccessCode();
                attempts++;
            }
        }

        const project = await projectService.createProject(projectName, interaction.guildId, accessCode);

        const displayName = interaction.member && "displayName" in interaction.member && interaction.member.displayName
            ? (interaction.member.displayName as string)
            : interaction.user.username;

        try {
            await userService.addMember(interaction.user.id, project.id, displayName);
        } catch (userError) {
            Logger.error("Failed to add project creator as a member in the database:", userError);
        }

        const embed = buildEmbed({
            title: `🏰  Nova Guilda Fundada!`,
            description: [
                HEADERS.welcome,
                "",
                `${ICONS.diamond} A guilda **${projectName}** abriu suas portas para aventureiros!`,
                "",
                `${ICONS.arrow} Compartilhe o pergaminho de acesso com seus companheiros`,
                `${ICONS.arrow} Eles podem se juntar usando \`/join_project\``,
                "",
                questBox(accessCode),
                "",
                `${ICONS.sparkle} *Você foi automaticamente adicionado como membro da guilda.*`,
            ].join("\n"),
            color: COLORS.success,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
