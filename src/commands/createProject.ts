import { randomBytes } from "node:crypto";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { Logger } from "../logger.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { COLORS, ICONS, HEADERS, buildEmbed, questBox, errorMsg } from "../utils/theme.js";

const generateAccessCode = (len = 6) => Array.from(randomBytes(len), b => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 36]).join("");

export const createProject: Command = {
    name: "create_project",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."), flags: MessageFlags.Ephemeral });
        await interaction.deferReply();

        const projectName = interaction.options.getString("name", true);
        const existingProject = await projectService.getProjectByGuild(interaction.guildId);
        if (existingProject) return void await interaction.editReply({ content: errorMsg(`A guilda **${existingProject.name}** já existe neste servidor! Apenas uma guilda pode ser criada por servidor.`) });

        let accessCode = generateAccessCode();
        let attempts = 0;
        while (await projectService.getProjectByAccessCode(accessCode) && attempts++ < 10) accessCode = generateAccessCode();

        const project = await projectService.createProject(projectName, interaction.guildId, accessCode);
        const displayName = interaction.member && "displayName" in interaction.member && interaction.member.displayName ? (interaction.member.displayName as string) : interaction.user.username;

        await userService.addMember(interaction.user.id, project.id, displayName).catch(err => Logger.error("Failed to add creator:", err));

        const embed = buildEmbed({
            title: "🏰  Nova Guilda Fundada!",
            description: [
                HEADERS.welcome, "", `${ICONS.diamond} A guilda **${projectName}** abriu suas portas para aventureiros!`, "",
                `${ICONS.arrow} Compartilhe o pergaminho de acesso com seus companheiros`,
                `${ICONS.arrow} Eles podem se juntar usando \`/join_project\``, "",
                questBox(accessCode), "", `${ICONS.sparkle} *Você foi automaticamente adicionado como membro da guilda.*`
            ].join("\n"),
            color: COLORS.success,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
