// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BOMB — RPG Adventure Design System
//  Theme: Cute Medieval Adventure (Anime / Adventure Time)
//  ANSI colored headers, RPG emojis, class-based colors.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { EmbedBuilder } from "discord.js";

// ─── Color Palette (Bright Adventure Colors) ──────────
export const COLORS = {
    primary:   0x9B59B6,  // Amethyst Purple — main arcane brand
    success:   0x2ECC71,  // Potion Green — healing / success
    danger:    0xE74C3C,  // Dragon Flame — errors / danger
    sprint:    0x8E44AD,  // Portal Purple — expeditions
    daily:     0x3498DB,  // Quest Blue — daily quests
    neutral:   0x95A5A6,  // Stone Gray — inactive / muted
    gold:      0xF1C40F,  // Treasure Gold — rewards / loot
    dark:      0x2C3E50,  // Night Sky — deep backgrounds
    legendary: 0xFFD700,  // Legendary Gold — epic moments
} as const;

// ─── Class-Specific Embed Colors ──────────────────────
export const CLASS_COLORS: Record<string, number> = {
    "Gobbo":            0x77DD77,  // Lucky Clover Green
    "Angel Gobbo":      0xFFE66D,  // Divine Yellow
    "Angel":            0xFFC857,  // Celestial Gold
    "Spearman":         0xFF6B6B,  // Valor Red
    "Sunflower Knight": 0xFFD93D,  // Sunflower Gold
    "Zombie Shieldman": 0x6BCB77,  // Undead Green
    "Mooladin":         0xD4A373,  // Earthy Brown
    "Heretic Mooladin": 0x9D4EDD,  // Demonic Purple
    "Healer":           0xFF85C0,  // Healing Pink
    "Druid":            0x52B788,  // Nature Green
    "Moth Mage":        0xC77DFF,  // Arcane Lavender
    "Beast Tamer":      0xE9967A,  // Warm Salmon
    "Beast Huntress":   0x48BFE3,  // Hunter Blue
    "Lightbringer":     0xFFD700,  // Legendary Gold
    "Scissorpaw":       0x00B4D8,  // Sharp Cyan
    "Fox Musketeer":    0xFF8C42,  // Fox Orange
};

/** Returns the embed color matching a character class */
export function getClassColor(className?: string): number {
    return CLASS_COLORS[className || "Gobbo"] ?? COLORS.primary;
}

// ─── RPG Emoji Map ────────────────────────────────────
export const ICONS = {
    // Status
    success:    "✅",
    error:      "❌",
    warning:    "⚠️",
    info:       "💡",
    pending:    "⏳",
    active:     "🔥",

    // Entities
    bomb:       "💣",
    user:       "⚔️",
    team:       "🛡️",
    key:        "🗝️",
    channel:    "📡",

    // Time & Schedule
    clock:      "⏰",
    calendar:   "📅",
    timer:      "⏱️",
    timezone:   "🌍",

    // Sprint / Expedition
    sprint:     "🏁",
    repeat:     "🔄",
    flag:       "🚩",
    finish:     "🎯",

    // Adventure
    quest:      "📜",
    guild:      "🏰",
    crown:      "👑",
    potion:     "⚗️",
    scroll:     "📜",
    sword:      "🗡️",
    shield:     "🛡️",
    magic:      "🔮",
    treasure:   "💎",
    map:        "🗺️",

    // Misc
    arrow:      "▸",
    arrowRight: "►",
    diamond:    "💠",
    dot:        "·",
    star:       "⭐",
    sparkle:    "✨",
    bolt:       "⚡",
    gear:       "⚙️",
    link:       "🔗",
    check:      "✅",
    cross:      "❌",
    blocker:    "🚧",
    none:       "—",
    xp:         "🌟",
    levelup:    "🎉",
    streak:     "🔥",
    badge:      "🏆",
} as const;

// ─── ANSI Color Utilities ─────────────────────────────
// Discord supports ANSI escape codes inside ```ansi code blocks
// for real colored text — one of the most modern visual features.

const ESC = "\u001b";

export const ANSI = {
    RED:    31,
    GREEN:  32,
    YELLOW: 33,
    BLUE:   34,
    PINK:   35,
    CYAN:   36,
    WHITE:  37,
} as const;

/** Wraps text in ANSI escape codes for colored Discord code blocks */
export function ansiColor(text: string, colorCode: number, bold: boolean = true): string {
    const style = bold ? 1 : 0;
    return `${ESC}[${style};${colorCode}m${text}${ESC}[0m`;
}

/** Creates a Discord \`\`\`ansi code block with colored lines */
export function ansiBlock(lines: string[]): string {
    return "```ansi\n" + lines.join("\n") + "\n```";
}

// ─── Dividers & Decorators ────────────────────────────
export const DIVIDERS = {
    thin:     "─────────────────────────────",
    thick:    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    double:   "═════════════════════════════",
    dotted:   "· · · · · · · · · · · · · · ·",
    dashed:   "- - - - - - - - - - - - - - -",
    sparkle:  "✦ ⋆ ✦ ⋆ ✦ ⋆ ✦ ⋆ ✦ ⋆ ✦ ⋆ ✦",
    stars:    "⋆ ˚ ☆ ˚ ⋆ ˚ ☆ ˚ ⋆ ˚ ☆ ˚ ⋆",
    quest:    "─── ⋆⋅☆⋅⋆ ──── ⋆⋅☆⋅⋆ ───",
    scroll:   "═══════════════════════════════",
    wave:     "∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿",
    block:    "░▒▓█▓▒░ ░▒▓█▓▒░ ░▒▓█▓▒░",
} as const;

// ─── ANSI Art Headers ─────────────────────────────────
// Colored box-drawing headers rendered inside ```ansi blocks.
// Medieval scroll aesthetic with real colors in Discord.

export const HEADERS = {
    bomb: ansiBlock([
        ansiColor("╔══════════════════════════════════╗", ANSI.YELLOW),
        ansiColor("║    B  ·  O  ·  M  ·  B          ║", ANSI.WHITE),
        ansiColor("║    Adventure Guild System        ║", ANSI.CYAN),
        ansiColor("╚══════════════════════════════════╝", ANSI.YELLOW),
    ]),

    daily: ansiBlock([
        ansiColor("╔══════════════════════════════════╗", ANSI.YELLOW),
        ansiColor("║  QUEST LOG  ·  DAILY EXPEDITION  ║", ANSI.CYAN),
        ansiColor("╚══════════════════════════════════╝", ANSI.YELLOW),
    ]),

    sprint: ansiBlock([
        ansiColor("╔══════════════════════════════════╗", ANSI.PINK),
        ansiColor("║  EXPEDITION MAP  ·  SPRINT       ║", ANSI.YELLOW),
        ansiColor("╚══════════════════════════════════╝", ANSI.PINK),
    ]),

    danger: ansiBlock([
        ansiColor("╔══════════════════════════════════╗", ANSI.RED),
        ansiColor("║  !! DANGER ZONE !!               ║", ANSI.RED),
        ansiColor("╚══════════════════════════════════╝", ANSI.RED),
    ]),

    welcome: ansiBlock([
        ansiColor("╔══════════════════════════════════╗", ANSI.GREEN),
        ansiColor("║  WELCOME TO THE ADVENTURE!       ║", ANSI.WHITE),
        ansiColor("╚══════════════════════════════════╝", ANSI.GREEN),
    ]),

    config: ansiBlock([
        ansiColor("╔══════════════════════════════════╗", ANSI.CYAN),
        ansiColor("║  MAGIC CONFIGURATION TOME        ║", ANSI.WHITE),
        ansiColor("╚══════════════════════════════════╝", ANSI.CYAN),
    ]),

    victory: ansiBlock([
        ansiColor("╔══════════════════════════════════╗", ANSI.GREEN),
        ansiColor("║  EPIC VICTORY!  ·  QUEST CLEAR   ║", ANSI.YELLOW),
        ansiColor("╚══════════════════════════════════╝", ANSI.GREEN),
    ]),
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
 * ANSI-colored progress bar for use inside ansiBlock().
 * Renders green filled + dim empty with real Discord colors.
 */
export function ansiProgressBar(current: number, total: number, length: number = 12): string {
    if (total === 0) return `${ansiColor("░".repeat(length), ANSI.WHITE, false)} 0/0`;
    const filled = Math.round((current / total) * length);
    const empty = length - filled;
    return `${ansiColor("▓".repeat(filled), ANSI.GREEN)}${ansiColor("░".repeat(empty), ANSI.WHITE, false)} ${ansiColor(`${current}/${total}`, ANSI.CYAN)}`;
}

/**
 * Section title with icon:  ⚔️  **SECTION NAME**
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
 * RPG status badge:  [ 🔥 ATIVO ] or [ ⏳ INATIVO ]
 */
export function statusBadge(label: string, active: boolean): string {
    return active
        ? `\`[ 🔥 ${label.toUpperCase()} ]\``
        : `\`[ ⏳ ${label.toUpperCase()} ]\``;
}

/**
 * Key-value pair with bold key
 */
export function kvPair(key: string, value: string): string {
    return `**${key}:** ${value}`;
}

/**
 * Quest scroll box — golden ANSI-colored frame for important values.
 * Used for access codes, important announcements, etc.
 */
export function questBox(value: string): string {
    const pad = value.length + 4;
    return ansiBlock([
        ansiColor(`  ╔${"═".repeat(pad)}╗`, ANSI.YELLOW),
        `  ${ansiColor("║", ANSI.YELLOW)}  ${ansiColor(value, ANSI.WHITE)}  ${ansiColor("║", ANSI.YELLOW)}`,
        ansiColor(`  ╚${"═".repeat(pad)}╝`, ANSI.YELLOW),
    ]);
}

/**
 * @deprecated Use questBox() instead — kept for backward compatibility
 */
export function framedValue(value: string): string {
    return questBox(value);
}

/**
 * Inline code box
 */
export function codeBox(value: string): string {
    return `\`${value}\``;
}

/**
 * Scroll-style divider for separating embed sections
 */
export function scrollDivider(): string {
    return DIVIDERS.quest;
}

/**
 * Build a themed RPG embed with consistent adventure footer.
 * Supports optional author field for user avatars.
 */
export function buildEmbed(options: {
    title?: string;
    description?: string;
    color?: number;
    thumbnail?: string;
    author?: { name: string; iconURL?: string };
}): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(options.color ?? COLORS.primary)
        .setTimestamp()
        .setFooter({ text: "💣 BOMB · Adventure Guild" });

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.author) {
        embed.setAuthor({
            name: options.author.name,
            iconURL: options.author.iconURL,
        });
    }

    return embed;
}

/**
 * Format an error message with RPG flair
 */
export function errorMsg(message: string): string {
    return `❌ ${message}`;
}

/**
 * Format a success message with RPG flair
 */
export function successMsg(message: string): string {
    return `✅ ${message}`;
}

/**
 * Format an info message
 */
export function infoMsg(message: string): string {
    return `💡 ${message}`;
}

/**
 * Format a warning message
 */
export function warningMsg(message: string): string {
    return `⚠️ ${message}`;
}

/**
 * Member display in tree format with adventure styling
 */
export function memberLine(mention: string, displayName: string, isLast: boolean = false): string {
    return `${isLast ? "└─" : "├─"} ⚔️ ${mention} *(${displayName})*`;
}

/**
 * Sprint/Expedition timeline visual with quest markers
 */
export function sprintTimeline(startDate: string, endDate: string, daysLeft?: number): string {
    const lines = [
        `🚩 ${codeBox(startDate)} ${"═".repeat(8)}► ${codeBox(endDate)}`,
    ];
    if (daysLeft !== undefined) {
        lines.push(`${"    "}⏱️ **${daysLeft}** dia(s) restante(s) na expedição`);
    }
    return lines.join("\n");
}
