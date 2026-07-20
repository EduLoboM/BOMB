import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
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
                content: errorMsg("Project not found! Please check the invite code and try again."),
            });
            return;
        }

        const existingUser = await userService.getMember(interaction.user.id, project.id);
        if (existingUser) {
            await interaction.editReply({
                content: infoMsg(`You are already a member of the project **${project.name}**!`),
            });
            return;
        }

        const displayName = interaction.member && "displayName" in interaction.member && interaction.member.displayName
            ? (interaction.member.displayName as string)
            : interaction.user.username;

        await userService.addMember(interaction.user.id, project.id, displayName);

        const embed = buildEmbed({
            title: `${ICONS.success}  Welcome Aboard`,
            description: [
                HEADERS.welcome,
                "",
                `${ICONS.user} **${displayName}** has joined **${project.name}**`,
                "",
                `${ICONS.arrow} You can now submit daily standups with \`/daily\``,
                `${ICONS.arrow} Check project status with \`/project_status\``,
                "",
                `${ICONS.sparkle} *Welcome to the team!*`,
            ].join("\n"),
            color: COLORS.success,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
