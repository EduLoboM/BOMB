// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BOMB — Visual Design System
//  All visual constants, formatters, and embed utilities.
//  Zero emojis. Pure Unicode + ASCII art.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { EmbedBuilder } from "discord.js";

// ─── Color Palette ────────────────────────────────────
export const COLORS = {
    primary:   0x6366F1,  // Electric Indigo
    success:   0x10B981,  // Emerald Glow
    danger:    0xEF4444,  // Crimson Pulse
    sprint:    0x8B5CF6,  // Violet Surge
    daily:     0x3B82F6,  // Sapphire Blue
    neutral:   0x64748B,  // Slate Ash
    gold:      0xF59E0B,  // Amber Radiance
    dark:      0x1E1B2E,  // Void Obsidian
} as const;

// ─── Unicode Icon Map ─────────────────────────────────
export const ICONS = {
    // Status
    success:    "◆",
    error:      "✖",
    warning:    "▲",
    info:       "◇",
    pending:    "○",
    active:     "●",

    // Entities
    bomb:       "✦",
    user:       "◉",
    team:       "⬡",
    key:        "⚿",
    channel:    "▣",

    // Time & Schedule
    clock:      "◷",
    calendar:   "◫",
    timer:      "⏱",
    timezone:   "⊕",

    // Sprint
    sprint:     "⟐",
    repeat:     "↻",
    flag:       "⚑",
    finish:     "◈",

    // Misc
    arrow:      "▸",
    arrowRight: "►",
    diamond:    "⬥",
    dot:        "·",
    star:       "★",
    sparkle:    "✧",
    bolt:       "⚡",
    shield:     "⛉",
    gear:       "⚙",
    link:       "⬢",
    check:      "✔",
    cross:      "✘",
    blocker:    "⊘",
    none:       "—",
} as const;

// ─── Dividers & Decorators ────────────────────────────
export const DIVIDERS = {
    thin:       "─────────────────────────────",
    thick:      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    double:     "═════════════════════════════",
    dotted:     "· · · · · · · · · · · · · · ·",
    dashed:     "- - - - - - - - - - - - - - -",
    sparkle:    "✧ · ✧ · ✧ · ✧ · ✧ · ✧ · ✧ · ✧",
    wave:       "∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿",
    block:      "░▒▓█▓▒░ ░▒▓█▓▒░ ░▒▓█▓▒░",
} as const;

// ─── ASCII Art Headers ────────────────────────────────
export const HEADERS = {
    bomb: [
        "```",
        "  ╔══════════════════════════════╗",
        "  ║   ✦  B · O · M · B  ✦       ║",
        "  ╚══════════════════════════════╝",
        "```",
    ].join("\n"),

    daily: [
        "```",
        "  ┌─────────────────────────────┐",
        "  │  ◷  DAILY STANDUP REPORT    │",
        "  └─────────────────────────────┘",
        "```",
    ].join("\n"),

    sprint: [
        "```",
        "  ┌─────────────────────────────┐",
        "  │  ⟐  SPRINT OVERVIEW         │",
        "  └─────────────────────────────┘",
        "```",
    ].join("\n"),

    danger: [
        "```",
        "  ╔══════════════════════════════╗",
        "  ║  ▲  DANGER ZONE             ║",
        "  ╚══════════════════════════════╝",
        "```",
    ].join("\n"),

    welcome: [
        "```",
        "  ┌─────────────────────────────┐",
        "  │  ✧  WELCOME ABOARD          │",
        "  └─────────────────────────────┘",
        "```",
    ].join("\n"),

    config: [
        "```",
        "  ┌─────────────────────────────┐",
        "  │  ⚙  CONFIGURATION           │",
        "  └─────────────────────────────┘",
        "```",
    ].join("\n"),
} as const;

// ─── Formatting Utilities ─────────────────────────────

/**
 * ASCII progress bar:  ▓▓▓▓▓░░░░░ 5/10
 */
export function progressBar(current: number, total: number, length: number = 12): string {
    if (total === 0) return `${"░".repeat(length)} 0/0`;
    const filled = Math.round((current / total) * length);
    const empty = length - filled;
    return `${"▓".repeat(filled)}${"░".repeat(empty)} ${current}/${total}`;
}

/**
 * Section title with icon:  ◆ SECTION NAME
 */
export function sectionTitle(icon: string, text: string): string {
    return `${icon}  **${text}**`;
}

/**
 * Tree-style list items:
 *   ├─ First item
 *   ├─ Second item
 *   └─ Last item
 */
export function treeList(items: string[], indent: number = 0): string {
    const pad = " ".repeat(indent);
    return items.map((item, i) => {
        const prefix = i === items.length - 1 ? "└─" : "├─";
        return `${pad}${prefix} ${item}`;
    }).join("\n");
}

/**
 * Single tree item (non-terminal):  ├─ item
 */
export function treeItem(text: string, isLast: boolean = false): string {
    return `${isLast ? "└─" : "├─"} ${text}`;
}

/**
 * Status badge:  [ ● ACTIVE ] or [ ○ ENDED ]
 */
export function statusBadge(label: string, active: boolean): string {
    return active
        ? `\`[ ${ICONS.active} ${label.toUpperCase()} ]\``
        : `\`[ ${ICONS.pending} ${label.toUpperCase()} ]\``;
}

/**
 * Key-value pair with aligned formatting
 */
export function kvPair(key: string, value: string): string {
    return `**${key}:** ${value}`;
}

/**
 * Framed code block for emphasis (e.g., access codes)
 */
export function framedValue(value: string): string {
    return [
        "```",
        `  ╔${"═".repeat(value.length + 4)}╗`,
        `  ║  ${value}  ║`,
        `  ╚${"═".repeat(value.length + 4)}╝`,
        "```",
    ].join("\n");
}

/**
 * Inline code box
 */
export function codeBox(value: string): string {
    return `\`${value}\``;
}

/**
 * Build a themed embed with consistent footer
 */
export function buildEmbed(options: {
    title?: string;
    description?: string;
    color?: number;
    thumbnail?: string;
}): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(options.color ?? COLORS.primary)
        .setTimestamp()
        .setFooter({ text: `${ICONS.bomb} BOMB ${ICONS.dot} Project Management` });

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);

    return embed;
}

/**
 * Format an error message consistently
 */
export function errorMsg(message: string): string {
    return `${ICONS.error} ${message}`;
}

/**
 * Format a success message consistently
 */
export function successMsg(message: string): string {
    return `${ICONS.success} ${message}`;
}

/**
 * Format an info message consistently
 */
export function infoMsg(message: string): string {
    return `${ICONS.info} ${message}`;
}

/**
 * Format a warning message consistently
 */
export function warningMsg(message: string): string {
    return `${ICONS.warning} ${message}`;
}

/**
 * Member display in tree format with role info
 */
export function memberLine(mention: string, displayName: string, isLast: boolean = false): string {
    return `${isLast ? "└─" : "├─"} ${ICONS.user} ${mention} *(${displayName})*`;
}

/**
 * Sprint timeline visual
 */
export function sprintTimeline(startDate: string, endDate: string, daysLeft?: number): string {
    const lines = [
        `${ICONS.flag} ${codeBox(startDate)} ${"─".repeat(8)}► ${codeBox(endDate)}`,
    ];
    if (daysLeft !== undefined) {
        lines.push(`${" ".repeat(4)}${ICONS.timer} **${daysLeft}** day(s) remaining`);
    }
    return lines.join("\n");
}
