import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { t, isValidLanguage, SUPPORTED_LANGUAGES, Language } from "../i18n/index.js";
import { Logger } from "../logger.js";
import { buildEmbed, COLORS } from "../utils/theme.js";

export const setupLanguageCommand: Command = {
    name: "setup_language",
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.guildId) return void await interaction.reply({ content: t("project.notFound", "pt"), ephemeral: true });

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) return void await interaction.reply({ content: t("project.notFound", "pt"), ephemeral: true });

        const currentLang: Language = (project.language as Language) || "pt";
        const langInput = interaction.options.getString("language");

        if (!langInput) {
            const embed = buildEmbed({
                title: t("language.title", currentLang),
                description: [
                    t("language.current", currentLang, { project: project.name, language: `${SUPPORTED_LANGUAGES[currentLang].flag} ${SUPPORTED_LANGUAGES[currentLang].name}` }), "",
                    "**Idiomas Disponíveis / Supported Languages:**",
                    "• `pt` — 🇧🇷 Português", "• `en` — 🇺🇸 English", "• `es` — 🇪🇸 Español", "• `de-CH` — 🇨🇭 Schwiizertütsch (Suíço)", "• `no` — 🇳🇴 Norsk (Norueguês)"
                ].join("\n"),
                color: COLORS.primary
            });
            return void await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!isValidLanguage(langInput)) return void await interaction.reply({ content: t("language.invalid", currentLang), ephemeral: true });

        const selectedLang = langInput as Language;
        await projectService.updateLanguage(project.id, selectedLang);
        const langInfo = SUPPORTED_LANGUAGES[selectedLang];

        await interaction.reply({ embeds: [buildEmbed({ title: t("language.title", selectedLang), description: t("language.updated", selectedLang, { language: `${langInfo.flag} ${langInfo.name}` }), color: COLORS.success })] });
        Logger.info(`Language for project ${project.name} (Guild: ${interaction.guildId}) changed to ${selectedLang}`);
    }
};
