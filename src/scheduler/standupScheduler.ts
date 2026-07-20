import { Client } from "discord.js";
import { Logger } from "../logger.js";
import { projectService } from "../services/projectService.js";
import { sprintService } from "../services/sprintService.js";
import { dateUtils } from "../utils/dateUtils.js";
import { reportUtils } from "../utils/reportUtils.js";

/** Active timer handles for graceful shutdown */
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

            // Sprints are sorted by number DESC in getSprints
            const latestSprint = sprints[0]!;

            if (todayStr > latestSprint.end_date) {
                // The current sprint has ended. Create the next one starting the day after end_date.
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

/**
 * Drift-safe scheduling: re-calculates delay to the next exact minute boundary.
 * This avoids the accumulative drift problem of a flat setInterval(60000).
 */
function scheduleNextMinuteCheck(callback: () => void): ReturnType<typeof setTimeout> {
    const delay = 60_000 - (Date.now() % 60_000);
    return setTimeout(() => {
        callback();
        standupTimer = scheduleNextMinuteCheck(callback);
    }, delay);
}

export function startScheduler(client: Client) {
    Logger.info("Starting daily standup scheduler...");
    
    // Run the sprint repeat check immediately on startup
    checkAndRepeatSprints();

    // Drift-safe standup check: aligns to the next minute boundary each cycle
    standupTimer = scheduleNextMinuteCheck(() => {
        checkAndSendStandups(client);
    });

    // Run the sprint repeat check every hour (3600000 ms)
    sprintInterval = setInterval(() => checkAndRepeatSprints(), 3_600_000);
}

/**
 * Cleans up all scheduler timers for graceful shutdown.
 */
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
