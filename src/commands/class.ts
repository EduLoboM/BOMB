import { ChatInputCommandInteraction, MessageFlags, GuildMember } from "discord.js";
import { Command } from "./commandInterface.js";
import { userService } from "../services/userService.js";
import { gamificationService, CLASS_REGISTRY, createClassSelectRow } from "../services/gamificationService.js";
import { COLORS, ICONS, DIVIDERS, buildEmbed, successMsg, errorMsg, getClassColor } from "../utils/theme.js";

export const classCommand: Command = {
    name: "class",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: `${ICONS.error} Este comando só pode ser executado dentro de um servidor do Discord.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        const selectedClass = interaction.options.getString("select");
        const currentLevel = user.level ?? 1;
        const currentClass = user.character_class || "Gobbo";
        const classChosenAtLevel = user.class_chosen_at_level ?? 1;

        if (selectedClass) {
            const classDef = CLASS_REGISTRY[selectedClass];
            if (!classDef) {
                await interaction.editReply({
                    content: errorMsg(`Classe inválida **${selectedClass}**. Selecione através do menu interativo abaixo!`),
                });
                return;
            }

            const tier1Classes = ["Gobbo", "Spearman", "Mooladin", "Healer", "Beast Tamer", "Scissorpaw"];
            const availableEvolutions = gamificationService.getAvailableEvolutions(currentClass, currentLevel, classChosenAtLevel);

            const isInitialSelection = tier1Classes.includes(selectedClass) && currentClass === "Gobbo";
            const isEvolution = availableEvolutions.includes(selectedClass);

            if (!isInitialSelection && !isEvolution && selectedClass !== currentClass) {
                await interaction.editReply({
                    content: errorMsg(
                        `Você não pode trocar diretamente para **${selectedClass}**. Escolha uma classe base ou alcance o nível necessário para evoluir!`
                    ),
                });
                return;
            }

            await gamificationService.changeUserClass(user, selectedClass);

            await interaction.editReply({
                content: successMsg(`Classe alterada com sucesso para ${classDef.icon} **${classDef.name}**!\n\n⚡ **Passiva:** ${classDef.passiveInfo}`),
            });
            return;
        }
        const availableEvolutions = gamificationService.getAvailableEvolutions(currentClass, currentLevel, classChosenAtLevel);
        const currentClassDef = CLASS_REGISTRY[currentClass] || CLASS_REGISTRY["Gobbo"]!;

        const embed = buildEmbed({
            title: `🛡️  Santuário de Evolução`,
            description: [
                `> ${currentClassDef.icon} Classe Atual: **${currentClassDef.name}** · Nível **${currentLevel}**`,
                `> *${currentClassDef.passiveInfo}*`,
            ].join("\n"),
            color: getClassColor(currentClass),
            author: {
                name: `${currentClassDef.name} · Estágio ${currentClassDef.tier}`,
                iconURL: interaction.user.displayAvatarURL(),
            },
        });

        if (availableEvolutions.length > 0) {
            embed.addFields({
                name: `⚡  EVOLUÇÃO DISPONÍVEL!`,
                value: [
                    `✨ Escolha no menu abaixo para evoluir:`,
                    ...availableEvolutions.map(e => {
                        const def = CLASS_REGISTRY[e]!;
                        return `${ICONS.arrow} ${def.icon} **${def.name}** — *${def.passiveInfo}*`;
                    }),
                ].join("\n"),
                inline: false
            });
        }

        const tier1Lines = ["Gobbo", "Spearman", "Mooladin", "Healer", "Beast Tamer", "Scissorpaw"].map(cName => {
            const def = CLASS_REGISTRY[cName]!;
            const isCurrent = cName === currentClass;
            const marker = isCurrent ? " ⭐" : "";
            return `${def.icon} **${def.name}**${marker}: *${def.passiveInfo}*`;
        });

        embed.addFields({
            name: `📜  Classes Base (Estágio 1)`,
            value: tier1Lines.join("\n"),
            inline: false
        });

        const row = createClassSelectRow(user);

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
};
