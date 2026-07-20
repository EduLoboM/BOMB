import { Client } from "discord.js";
import { Logger } from "../logger.js";
import { projectService } from "../services/projectService.js";
import { dateUtils } from "../utils/dateUtils.js";
import { reportUtils } from "../utils/reportUtils.js";

async function checkAndSendStandups(client: Client) {
    try {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const currentTime = `${hh}:${mm}`;

        const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const currentDay = dayNames[now.getDay()];

        const projects = await projectService.getAllScheduledProjects();
        if (!projects) return;

        for (const project of projects) {
            const projectTime = project.daily_time.substring(0, 5);
            if (projectTime !== currentTime) {
                continue;
            }

            const weekdays = project.weekdays.split(",").map((d: string) => d.trim().toLowerCase());
            if (!weekdays.includes(currentDay)) {
                continue;
            }

            const todayStr = dateUtils.getLocalDateString(now);
            Logger.info(`Scheduled daily reminder triggered for project "${project.name}" (Guild: ${project.guild_id})`);
            await reportUtils.sendOrUpdateDailyReport(client, project, todayStr);
        }
    } catch (err) {
        Logger.error("Error checking and sending scheduled daily standups:", err);
    }
}

export function startScheduler(client: Client) {
    Logger.info("Starting daily standup scheduler...");
    const delay = 60000 - (Date.now() % 60000);
    setTimeout(() => {
        checkAndSendStandups(client);
        setInterval(() => checkAndSendStandups(client), 60000);
    }, delay);
}
