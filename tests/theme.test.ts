import { describe, it, expect } from "vitest";
import {
    getClassColor,
    COLORS,
    CLASS_COLORS,
    progressBar,
    ansiBlock,
    ansiProgressBar,
    kvPair,
    codeBox,
    buildEmbed,
    successMsg,
    errorMsg,
    infoMsg,
    warningMsg
} from "../src/utils/theme.js";

describe("Theme System Utilities", () => {
    describe("getClassColor", () => {
        it("returns the exact hex color for registered classes", () => {
            expect(getClassColor("Gobbo")).toBe(CLASS_COLORS["Gobbo"]);
            expect(getClassColor("Iron Mooladin")).toBe(CLASS_COLORS["Iron Mooladin"]);
            expect(getClassColor("Dashing Fencer")).toBe(CLASS_COLORS["Dashing Fencer"]);
            expect(getClassColor("Undead Shieldsman")).toBe(CLASS_COLORS["Undead Shieldsman"]);
        });

        it("falls back to Gobbo color or primary color if class is unknown", () => {
            expect(getClassColor("UnknownClass")).toBe(COLORS.primary);
            expect(getClassColor()).toBe(CLASS_COLORS["Gobbo"]);
        });
    });

    describe("Formatting Helpers", () => {
        it("generates correct unicode progress bar", () => {
            const bar = progressBar(50, 100, 10);
            expect(bar).toContain("▓");
            expect(bar).toContain("░");
        });

        it("handles 0 max in progress bar without crashing", () => {
            const bar = progressBar(5, 0, 10);
            expect(bar).toBeDefined();
        });

        it("generates ANSI progress bar", () => {
            const ansiBar = ansiProgressBar(75, 100, 20);
            expect(ansiBar).toContain("▓");
            expect(ansiBar).toContain("░");
        });

        it("wraps text into ANSI block", () => {
            const block = ansiBlock(["Line 1", "Line 2"]);
            expect(block).toContain("```ansi");
            expect(block).toContain("Line 1");
            expect(block).toContain("Line 2");
        });

        it("formats key-value pair and codebox", () => {
            expect(kvPair("Status", "Active")).toBe("**Status:** Active");
            expect(codeBox("100 XP")).toBe("`100 XP`");
        });

        it("formats notification messages", () => {
            expect(successMsg("Success!")).toContain("Success!");
            expect(errorMsg("Error!")).toContain("Error!");
            expect(infoMsg("Info!")).toContain("Info!");
            expect(warningMsg("Warn!")).toContain("Warn!");
        });

        it("builds discord embed with options", () => {
            const embed = buildEmbed({
                title: "Test Title",
                description: "Test Description",
                color: 0xFF0000,
                author: { name: "Author Name", iconURL: "https://example.com/icon.png" }
            });

            expect(embed.data.title).toBe("Test Title");
            expect(embed.data.description).toBe("Test Description");
            expect(embed.data.color).toBe(0xFF0000);
        });
    });
});
