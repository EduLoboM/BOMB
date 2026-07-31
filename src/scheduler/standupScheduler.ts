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

            if (project.daily_time?.substring(0, 5) === tzInfo.time && dateUtils.isWeekdayMatching(project.weekdays, now, timezone)) {
                Logger.info(`Scheduled daily reminder triggered for project "${project.name}" (Guild: ${project.guild_id}) in timezone ${timezone}`);
                await reportUtils.sendOrUpdateDailyReport(client, project, tzInfo.dateString);
            }
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
            const todayStr = dateUtils.getDateTimeInTimezone(new Date(), timezone).dateString;

            const sprints = await sprintService.getSprints(project.id);
            if (!sprints.length) continue;
            const latest = sprints[0]!;

            if (todayStr > latest.end_date) {
                const nextStart = dateUtils.addDaysToDateString(latest.end_date, 1);
                const nextEnd = dateUtils.addDaysToDateString(nextStart, project.sprint_duration - 1);
                const nextNum = latest.number + 1;

                Logger.info(`Auto-repeating sprint for project "${project.name}": Creating Sprint #${nextNum} (${nextStart} to ${nextEnd}) in timezone ${timezone}`);
                await sprintService.createSprint(project.id, nextNum, nextStart, nextEnd);
            }
        }
    } catch (err) {
        Logger.error("Error during automatic sprint repetition check:", err);
    }
}

function scheduleNextMinuteCheck(callback: () => void): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
        callback();
        standupTimer = scheduleNextMinuteCheck(callback);
    }, 60_000 - (Date.now() % 60_000));
}

export function startScheduler(client: Client) {
    Logger.info("Starting daily standup scheduler...");
    checkAndRepeatSprints();
    standupTimer = scheduleNextMinuteCheck(() => checkAndSendStandups(client));
    sprintInterval = setInterval(checkAndRepeatSprints, 3_600_000);
}

export function stopScheduler(): void {
    if (standupTimer) { clearTimeout(standupTimer); standupTimer = null; }
    if (sprintInterval) { clearInterval(sprintInterval); sprintInterval = null; }
    Logger.info("Scheduler stopped.");
}
