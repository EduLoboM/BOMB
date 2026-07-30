import "dotenv/config";
import { REST, Routes } from "discord.js";
import { getRequiredEnv } from "./env.js";
import { allApplicationCommands } from "./commands/definitions.js";

const token = getRequiredEnv("DISCORD_TOKEN");
const clientId = getRequiredEnv("CLIENT_ID");
const guildId = getRequiredEnv("GUILD_ID");

const commands = allApplicationCommands.map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

async function deployCommands(): Promise<void> {
    console.log("Registering consolidated commands & context menus on the Discord API...");

    await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
    );

    console.log(`Successfully registered ${commands.length} Application Commands & Context Menus on Discord!`);
}

deployCommands().catch((error: unknown) => {
    console.error("Failed to register commands:", error);
    process.exitCode = 1;
});
