import "dotenv/config";
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

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
        .setName("create_project")
        .setDescription("Create a new project in the current server")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name of the project")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName("join_project")
        .setDescription("Join an existing project by invite code")
        .addStringOption((option) =>
            option
                .setName("code")
                .setDescription("The invite/access code of the project")
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName("project_status")
        .setDescription("View project config, members & sprint status"),
    new SlashCommandBuilder()
        .setName("setup_channel")
        .setDescription("Set the channel for daily reports")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel where daily reports will be posted")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName("setup_daily")
        .setDescription("Schedule standup reminders (e.g. 10:00, mon,tue,wed)")
        .addStringOption((option) =>
            option
                .setName("time")
                .setDescription("The time of the standup (HH:MM format)")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("days")
                .setDescription("Comma-separated weekdays (e.g. mon,tue,wed)")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("period")
                .setDescription("Daily open window duration (e.g., '30m', '2h', '1h30m', or minutes)")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("timezone")
                .setDescription("IANA Timezone name (e.g. 'America/Sao_Paulo', 'UTC'). Defaults to UTC")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName("setup_sprint")
        .setDescription("Define sprint start date & duration")
        .addStringOption((option) =>
            option
                .setName("start")
                .setDescription("Start date of the sprint (YYYY-MM-DD or 'today')")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("days")
                .setDescription("Duration of the sprint in days")
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName("repeat")
                .setDescription("Automatically repeat this sprint when it ends")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName("sprint_repeat")
        .setDescription("Enable or disable automatic sprint repetition")
        .addBooleanOption((option) =>
            option
                .setName("enabled")
                .setDescription("True to enable auto-repeat, False to disable")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName("finish_project")
        .setDescription("Finish and permanently delete the project for this server")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Manually open the daily modal (if you missed the alert)"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

async function deployCommands(): Promise<void> {
    console.log("Registering commands on the test server...");

    await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
    );

    console.log("Slash commands registered successfully.");
}

deployCommands().catch((error: unknown) => {
    console.error("Failed to register commands:", error);
    process.exitCode = 1;
});