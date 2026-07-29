import { Command } from "./commandInterface.js";
import { createProject } from "./createProject.js";
import { joinProject } from "./joinProject.js";
import { projectStatus } from "./projectStatus.js";
import { setupChannel } from "./setupChannel.js";
import { setupDaily } from "./setupDaily.js";
import { setupSprint } from "./setupSprint.js";
import { daily } from "./daily.js";
import { sprintRepeat } from "./sprintRepeat.js";
import { finishProject } from "./finishProject.js";
import { profileCommand } from "./profile.js";
import { leaderboardCommand } from "./leaderboard.js";
import { classCommand } from "./class.js";
import { setupRolesCommand } from "./setupRoles.js";

export const commands = new Map<string, Command>([
    [createProject.name, createProject],
    [joinProject.name, joinProject],
    [projectStatus.name, projectStatus],
    [setupChannel.name, setupChannel],
    [setupDaily.name, setupDaily],
    [setupSprint.name, setupSprint],
    [daily.name, daily],
    [sprintRepeat.name, sprintRepeat],
    [finishProject.name, finishProject],
    [profileCommand.name, profileCommand],
    [leaderboardCommand.name, leaderboardCommand],
    [classCommand.name, classCommand],
    [setupRolesCommand.name, setupRolesCommand],
]);
