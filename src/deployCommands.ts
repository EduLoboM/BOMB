import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`The variable ${name} was not defined in the .env file.`);
    }

    return value;
}

const token = getRequiredEnv("DISCORD_TOKEN");
const clientId = getRequiredEnv("CLIENT_ID");
const guildId = getRequiredEnv("GUILD_ID");

const commands = [
    new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Opens the bot's interactive panel"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

async function deployCommands(): Promise<void> {
    console.log("Registering commands on the test server...");

    await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
    );

    console.log("Command /panel registered.");
}

deployCommands().catch((error: unknown) => {
    console.error("Failed to register commands:", error);
    process.exitCode = 1;
});