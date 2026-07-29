import { Client } from "discord.js";
import { Logger } from "../logger.js";
import { projectService } from "../services/projectService.js";
import { sprintService } from "../services/sprintService.js";
import { dateUtils } from "../utils/dateUtils.js";
import { reportUtils } from "../utils/reportUtils.js";
let standupTimer: ReturnType<typeof setTimeout> | null = null;
let sprintInterval: ReturnType<typeof setInterval> | null = null;

export async function checkAndSendStandups(client: Client) {
    try {
        const now = new Date();
        const projects = await projectService.getAllScheduledProjects();
        if (!projects) return;

        for (const project of projects) {
            const timezone = project.timezone || "UTC";
            const tzInfo = dateUtils.getDateTimeInTimezone(now, timezone);

            const projectTime = project.daily_time!.substring(0, 5);
            if (projectTime !== tzInfo.time) {
                continue;
            }

            const weekdays = project.weekdays!.split(",").map((d: string) => d.trim().toLowerCase());
            if (!weekdays.includes(tzInfo.weekday)) {
                continue;
            }

            const todayStr = tzInfo.dateString;
            Logger.info(`Scheduled daily reminder triggered for project "${project.name}" (Guild: ${project.guild_id}) in timezone ${timezone}`);
            await reportUtils.sendOrUpdateDailyReport(client, project, todayStr);
        }
    } catch (err) {
        Logger.error("Error checking and sending scheduled daily standups:", err);
    }
}

export async function checkAndRepeatSprints() {
    try {
        const projects = await projectService.getProjectsWithSprintRepeat();
        for (const project of projects) {
            if (!project.sprint_duration) continue;

            const timezone = project.timezone || "UTC";
            const tzInfo = dateUtils.getDateTimeInTimezone(new Date(), timezone);
            const todayStr = tzInfo.dateString;

            const sprints = await sprintService.getSprints(project.id);
            if (sprints.length === 0) continue;
            const latestSprint = sprints[0]!;

            if (todayStr > latestSprint.end_date) {

                const nextStartDateStr = dateUtils.addDaysToDateString(latestSprint.end_date, 1);
                const nextEndDateStr = dateUtils.addDaysToDateString(nextStartDateStr, project.sprint_duration - 1);

                const nextSprintNumber = latestSprint.number + 1;

                Logger.info(`Auto-repeating sprint for project "${project.name}": Creating Sprint #${nextSprintNumber} (${nextStartDateStr} to ${nextEndDateStr}) in timezone ${timezone}`);

                await sprintService.createSprint(
                    project.id,
                    nextSprintNumber,
                    nextStartDateStr,
                    nextEndDateStr
                );
            }
        }
    } catch (err) {
        Logger.error("Error during automatic sprint repetition check:", err);
    }
}
function scheduleNextMinuteCheck(callback: () => void): ReturnType<typeof setTimeout> {
    const delay = 60_000 - (Date.now() % 60_000);
    return setTimeout(() => {
        callback();
        standupTimer = scheduleNextMinuteCheck(callback);
    }, delay);
}

export function startScheduler(client: Client) {
    Logger.info("Starting daily standup scheduler...");
    checkAndRepeatSprints();
    standupTimer = scheduleNextMinuteCheck(() => {
        checkAndSendStandups(client);
    });
    sprintInterval = setInterval(() => checkAndRepeatSprints(), 3_600_000);
}
export function stopScheduler(): void {
    if (standupTimer) {
        clearTimeout(standupTimer);
        standupTimer = null;
    }
    if (sprintInterval) {
        clearInterval(sprintInterval);
        sprintInterval = null;
    }
    Logger.info("Scheduler stopped.");
}
