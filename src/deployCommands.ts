import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`A variável ${name} não foi definida no arquivo .env.`);
    }

    return value;
}

const token = getRequiredEnv("DISCORD_TOKEN");
const clientId = getRequiredEnv("CLIENT_ID");
const guildId = getRequiredEnv("GUILD_ID");

const commands = [
    new SlashCommandBuilder()
        .setName("painel")
        .setDescription("Abre o painel interativo do bot"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

async function deployCommands(): Promise<void> {
    console.log("Registrando comandos no servidor de testes...");

    await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
    );

    console.log("Comando /painel registrado.");
}

deployCommands().catch((error: unknown) => {
    console.error("Não foi possível registrar os comandos:", error);
    process.exitCode = 1;
});