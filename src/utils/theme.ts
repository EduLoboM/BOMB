import { EmbedBuilder } from "discord.js";
export const COLORS = {
    primary:   0x9B59B6,
    success:   0x2ECC71,
    danger:    0xE74C3C,
    sprint:    0x8E44AD,
    daily:     0x3498DB,
    neutral:   0x95A5A6,
    gold:      0xF1C40F,
    dark:      0x2C3E50,
    legendary: 0xFFD700,
} as const;
export const CLASS_COLORS: Record<string, number> = {
    "Gobbo":            0x77DD77,
    "Angel Gobbo":      0xFFE66D,
    "Angel":            0xFFC857,
    "Spearman":         0xFF6B6B,
    "Sunflower Knight": 0xFFD93D,
    "Undead Shieldsman": 0x6BCB77,
    "Mooladin":         0xD4A373,
    "Iron Mooladin":    0x7F8C8D,
    "Heretic Mooladin": 0x9D4EDD,
    "Healer":           0xFF85C0,
    "Druid":            0x52B788,
    "Moth Mage":        0xC77DFF,
    "Beast Tamer":      0xE9967A,
    "Beast Huntress":   0x48BFE3,
    "Lightbringer":     0xFFD700,
    "Scissorpaw":       0x00B4D8,
    "Dashing Fencer":   0x00D2D3,
    "Fox Musketeer":    0xFF8C42,
};
export function getClassColor(className?: string): number {
    return CLASS_COLORS[className || "Gobbo"] ?? COLORS.primary;
}
export const ICONS = {

    success:    "✅",
    error:      "❌",
    warning:    "⚠️",
    info:       "💡",
    pending:    "⏳",
    active:     "🔥",
    bomb:       "💣",
    user:       "⚔️",
    team:       "🛡️",
    key:        "🗝️",
    channel:    "📡",
    clock:      "⏰",
    calendar:   "📅",
    timer:      "⏱️",
    timezone:   "🌍",
    sprint:     "🏁",
    repeat:     "🔄",
    flag:       "🚩",
    finish:     "🎯",
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
export function ansiColor(text: string, colorCode: number, bold: boolean = true): string {
    const style = bold ? 1 : 0;
    return `${ESC}[${style};${colorCode}m${text}${ESC}[0m`;
}
export function ansiBlock(lines: string[]): string {
    return "```ansi\n" + lines.join("\n") + "\n```";
}
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
export function progressBar(current: number, total: number, length: number = 12): string {
    if (total === 0) return `${"░".repeat(length)} 0/0`;
    const filled = Math.round((current / total) * length);
    const empty = length - filled;
    return `${"▓".repeat(filled)}${"░".repeat(empty)} ${current}/${total}`;
}
export function ansiProgressBar(current: number, total: number, length: number = 12): string {
    if (total === 0) return `${ansiColor("░".repeat(length), ANSI.WHITE, false)} 0/0`;
    const filled = Math.round((current / total) * length);
    const empty = length - filled;
    return `${ansiColor("▓".repeat(filled), ANSI.GREEN)}${ansiColor("░".repeat(empty), ANSI.WHITE, false)} ${ansiColor(`${current}/${total}`, ANSI.CYAN)}`;
}
export function sectionTitle(icon: string, text: string): string {
    return `${icon}  **${text}**`;
}
export function treeList(items: string[], indent: number = 0): string {
    const pad = " ".repeat(indent);
    return items.map((item, i) => {
        const prefix = i === items.length - 1 ? "└─" : "├─";
        return `${pad}${prefix} ${item}`;
    }).join("\n");
}
export function treeItem(text: string, isLast: boolean = false): string {
    return `${isLast ? "└─" : "├─"} ${text}`;
}
export function statusBadge(label: string, active: boolean): string {
    return active
        ? `\`[ 🔥 ${label.toUpperCase()} ]\``
        : `\`[ ⏳ ${label.toUpperCase()} ]\``;
}
export function kvPair(key: string, value: string): string {
    return `**${key}:** ${value}`;
}
export function questBox(value: string): string {
    const pad = value.length + 4;
    return ansiBlock([
        ansiColor(`  ╔${"═".repeat(pad)}╗`, ANSI.YELLOW),
        `  ${ansiColor("║", ANSI.YELLOW)}  ${ansiColor(value, ANSI.WHITE)}  ${ansiColor("║", ANSI.YELLOW)}`,
        ansiColor(`  ╚${"═".repeat(pad)}╝`, ANSI.YELLOW),
    ]);
}
export function framedValue(value: string): string {
    return questBox(value);
}
export function codeBox(value: string): string {
    return `\`${value}\``;
}
export function scrollDivider(): string {
    return DIVIDERS.quest;
}
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
export function errorMsg(message: string): string {
    return `❌ ${message}`;
}
export function successMsg(message: string): string {
    return `✅ ${message}`;
}
export function infoMsg(message: string): string {
    return `💡 ${message}`;
}
export function warningMsg(message: string): string {
    return `⚠️ ${message}`;
}
export function memberLine(mention: string, displayName: string, isLast: boolean = false): string {
    return `${isLast ? "└─" : "├─"} ⚔️ ${mention} *(${displayName})*`;
}
export function sprintTimeline(startDate: string, endDate: string, daysLeft?: number): string {
    const lines = [
        `🚩 ${codeBox(startDate)} ${"═".repeat(8)}► ${codeBox(endDate)}`,
    ];
    if (daysLeft !== undefined) {
        lines.push(`${"    "}⏱️ **${daysLeft}** dia(s) restante(s) na expedição`);
    }
    return lines.join("\n");
}
