import { randomBytes } from "node:crypto";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { Logger } from "../logger.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import {
    COLORS, ICONS, HEADERS,
    buildEmbed, framedValue, errorMsg
} from "../utils/theme.js";

/**
 * Generates a cryptographically secure access code.
 * Uses node:crypto randomBytes instead of Math.random() for unpredictability.
 */
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
                content: errorMsg("This command can only be run inside a Discord server."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const projectName = interaction.options.getString("name", true);

        const existingProject = await projectService.getProjectByGuild(interaction.guildId);
        if (existingProject) {
            await interaction.editReply({
                content: errorMsg(`A project named **${existingProject.name}** already exists for this server! Only one project can be created per server.`),
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
            title: `${ICONS.success}  Project Created`,
            description: [
                HEADERS.welcome,
                "",
                `${ICONS.diamond} **${projectName}** is now live!`,
                "",
                `${ICONS.arrow} Share the invite code below with your team`,
                `${ICONS.arrow} They can join using \`/join_project\``,
                "",
                framedValue(accessCode),
                "",
                `${ICONS.sparkle} *You have been automatically added as a member.*`,
            ].join("\n"),
            color: COLORS.success,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
