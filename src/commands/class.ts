import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { userService } from "../services/userService.js";
import { gamificationService, CLASS_REGISTRY, createClassSelectRow } from "../services/gamificationService.js";
import { ICONS, buildEmbed, successMsg, errorMsg, getClassColor } from "../utils/theme.js";

export const classCommand: Command = {
    name: "class",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: `${ICONS.error} Este comando só pode ser executado dentro de um servidor do Discord.`, flags: MessageFlags.Ephemeral });
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
        const selectedClass = interaction.options.getString("select");
        const currentLevel = user.level ?? 1, currentClass = user.character_class || "Gobbo", classChosenAtLevel = user.class_chosen_at_level ?? 1;

        if (selectedClass) {
            const classDef = CLASS_REGISTRY[selectedClass];
            if (!classDef) return void await interaction.editReply({ content: errorMsg(`Classe inválida **${selectedClass}**. Selecione através do menu interativo abaixo!`) });

            const baseClasses = ["Gobbo", "Spearman", "Mooladin", "Healer", "Beast Tamer", "Scissorpaw"];
            const availableEvolutions = gamificationService.getAvailableEvolutions(currentClass, currentLevel, classChosenAtLevel);

            if (!baseClasses.includes(selectedClass) && !availableEvolutions.includes(selectedClass) && selectedClass !== currentClass) {
                return void await interaction.editReply({ content: errorMsg(`Você não pode trocar diretamente para **${selectedClass}**. Escolha uma classe base ou alcance o nível necessário para evoluir!`) });
            }

            await gamificationService.changeUserClass(user, selectedClass);
            return void await interaction.editReply({ content: successMsg(`Classe alterada com sucesso para ${classDef.icon} **${classDef.name}**!\n\n⚡ **Passiva:** ${classDef.passiveInfo}`) });
        }

        const availableEvolutions = gamificationService.getAvailableEvolutions(currentClass, currentLevel, classChosenAtLevel);
        const currentDef = CLASS_REGISTRY[currentClass] || CLASS_REGISTRY["Gobbo"]!;

        const embed = buildEmbed({
            title: "🛡️  Santuário de Evolução",
            description: `> ${currentDef.icon} Classe Atual: **${currentDef.name}** · Nível **${currentLevel}**\n> *${currentDef.passiveInfo}*`,
            color: getClassColor(currentClass),
            author: { name: `${currentDef.name} · Estágio ${currentDef.tier}`, iconURL: interaction.user.displayAvatarURL() },
        });

        if (availableEvolutions.length > 0) {
            embed.addFields({ name: "⚡  EVOLUÇÃO DISPONÍVEL!", value: ["✨ Escolha no menu abaixo para evoluir:", ...availableEvolutions.map(e => `${ICONS.arrow} ${CLASS_REGISTRY[e]!.icon} **${CLASS_REGISTRY[e]!.name}** — *${CLASS_REGISTRY[e]!.passiveInfo}*`)].join("\n"), inline: false });
        }

        const tier1Lines = ["Gobbo", "Spearman", "Mooladin", "Healer", "Beast Tamer", "Scissorpaw"].map(cName => {
            const def = CLASS_REGISTRY[cName]!;
            return `${def.icon} **${def.name}**${cName === currentClass ? " ⭐" : ""}: *${def.passiveInfo}*`;
        });

        embed.addFields({ name: "📜  Classes Base (Estágio 1)", value: tier1Lines.join("\n"), inline: false });
        await interaction.editReply({ embeds: [embed], components: [createClassSelectRow(user)] });
    }
};
