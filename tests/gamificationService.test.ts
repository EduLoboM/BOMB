import { vi, describe, it, expect } from "vitest";

vi.mock("../src/supabase.js", () => {
    return {
        supabase: {
            from: vi.fn()
        }
    };
});

import { gamificationService, CLASS_REGISTRY, createClassSelectRow } from "../src/services/gamificationService.js";
import { supabase } from "../src/supabase.js";
import type { User, Project } from "../src/types.js";

class MockSupabaseQuery {
    private dataVal: any;
    private errorVal: any;

    constructor(data: any, error: any) {
        this.dataVal = data;
        this.errorVal = error;
    }

    select = vi.fn().mockReturnThis();
    update = vi.fn().mockReturnThis();
    eq = vi.fn().mockReturnThis();

    then(onfulfilled: any) {
        return Promise.resolve({ data: this.dataVal, error: this.errorVal }).then(onfulfilled);
    }
}

describe("gamificationService", () => {
    const mockFrom = vi.mocked(supabase.from);

    describe("XP and Level Calculations", () => {
        it("calculates level thresholds correctly", () => {
            expect(gamificationService.getXPForLevel(1)).toBe(0);
            expect(gamificationService.getXPForLevel(2)).toBe(100);
            expect(gamificationService.calculateLevelFromXP(0)).toBe(1);
            expect(gamificationService.calculateLevelFromXP(100)).toBe(2);
            expect(gamificationService.calculateLevelFromXP(500)).toBe(3);
        });

        it("returns default class Gobbo", () => {
            expect(gamificationService.getDefaultClass()).toBe("Gobbo");
        });
    });

    describe("Class Registry and Evolutions", () => {
        it("contains all 6 class lines with proper tier progression", () => {
            const classes = Object.keys(CLASS_REGISTRY);
            expect(classes).toContain("Gobbo");
            expect(classes).toContain("Angel Gobbo");
            expect(classes).toContain("Angel");
            expect(classes).toContain("Spearman");
            expect(classes).toContain("Sunflower Knight");
            expect(classes).toContain("Undead Shieldsman");
            expect(classes).toContain("Mooladin");
            expect(classes).toContain("Iron Mooladin");
            expect(classes).toContain("Heretic Mooladin");
            expect(classes).toContain("Healer");
            expect(classes).toContain("Druid");
            expect(classes).toContain("Moth Mage");
            expect(classes).toContain("Beast Tamer");
            expect(classes).toContain("Beast Huntress");
            expect(classes).toContain("Lightbringer");
            expect(classes).toContain("Scissorpaw");
            expect(classes).toContain("Dashing Fencer");
            expect(classes).toContain("Fox Musketeer");
        });

        it("identifies Tier 1 evolution eligibility at Level 5", () => {
            expect(gamificationService.getAvailableEvolutions("Gobbo", 4)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Gobbo", 5)).toEqual(["Angel Gobbo"]);
        });

        it("identifies Tier 2 evolution eligibility at Level 15", () => {
            expect(gamificationService.getAvailableEvolutions("Angel Gobbo", 14)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Angel Gobbo", 15)).toEqual(["Angel"]);
        });

        it("handles 3-form evolution chains for Mooladin and Scissorpaw", () => {
            expect(gamificationService.getAvailableEvolutions("Mooladin", 4)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Mooladin", 5)).toEqual(["Iron Mooladin"]);
            expect(gamificationService.getAvailableEvolutions("Iron Mooladin", 14)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Iron Mooladin", 15)).toEqual(["Heretic Mooladin"]);

            expect(gamificationService.getAvailableEvolutions("Scissorpaw", 4)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Scissorpaw", 5)).toEqual(["Dashing Fencer"]);
            expect(gamificationService.getAvailableEvolutions("Dashing Fencer", 14)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Dashing Fencer", 15)).toEqual(["Fox Musketeer"]);
        });

        it("returns empty array for non-existent class or max tier class", () => {
            expect(gamificationService.getAvailableEvolutions("UnknownClass", 10)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Angel", 50)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Undead Shieldsman", 50)).toEqual([]);
        });
    });

    describe("Daily Submission Processing & Passives", () => {
        const dummyUser: User = {
            id: "u1",
            discord_id: "d1",
            project_id: "p1",
            display_name: "TestUser",
            xp: 50,
            level: 1,
            streak: 2,
            max_streak: 2,
            character_class: "Spearman",
            last_submission_date: null
        };

        const dummyProject: Project = {
            id: "p1",
            guild_id: "g1",
            channel_id: "c1",
            name: "TestProject",
            access_code: "123",
            daily_time: "10:00",
            weekdays: "mon,tue,wed",
            daily_period: 60,
            sprint_repeat: false,
            sprint_duration: null,
            timezone: "UTC",
            gamification_enabled: true
        };

        it("awards XP, streak bonus, and early bird bonus for Spearman class", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, null) as any);

            const result = await gamificationService.processDailySubmission(
                dummyUser,
                dummyProject,
                true,
                true,
                "Worked on features",
                "Testing code"
            );

            expect(result.xpGained).toBeGreaterThan(100);
            expect(result.newStreak).toBe(1);
            expect(result.passiveNotes).toContain("🗡️ First Strike Bonus (+50% XP)");
        });

        it("applies streak protection for Undead Shieldsman and Angel when missing days", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, null) as any);

            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 5);
            const userWithOldSub: User = {
                ...dummyUser,
                character_class: "Undead Shieldsman",
                streak: 10,
                last_submission_date: oldDate.toISOString()
            };

            const result = await gamificationService.processDailySubmission(
                userWithOldSub,
                dummyProject,
                false,
                false,
                "Short",
                "Short"
            );

            expect(result.newStreak).toBe(10);
        });

        it("applies Moth Mage passive bonuses (blocker free, detailed report, total multiplier)", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, null) as any);

            const mothUser = { ...dummyUser, character_class: "Moth Mage" };
            const longText = "a".repeat(60);
            const result = await gamificationService.processDailySubmission(
                mothUser,
                dummyProject,
                false,
                true, // no blockers
                longText,
                longText
            );

            expect(result.passiveNotes).toContain("🦋 Arcane Epiphany (+75 XP)");
            expect(result.passiveNotes).toContain("🦋 Arcane Report Detailed Update (+40 XP)");
            expect(result.passiveNotes).toContain("🦋 Arcane Boost (+25% Total XP)");
        });

        it("applies Beast Huntress detailed report bonus", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, null) as any);

            const huntressUser = { ...dummyUser, character_class: "Beast Huntress" };
            const longText = "a".repeat(60);
            const result = await gamificationService.processDailySubmission(
                huntressUser,
                dummyProject,
                false,
                false,
                longText,
                longText
            );

            expect(result.passiveNotes).toContain("🏹 Relentless Tracker Detailed Update (+45 XP)");
        });

        it("applies Lightbringer base XP bonus", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, null) as any);

            const lbUser = { ...dummyUser, character_class: "Lightbringer" };
            const result = await gamificationService.processDailySubmission(
                lbUser,
                dummyProject,
                false,
                false,
                "Done",
                "Todo"
            );

            expect(result.baseXP).toBe(160);
            expect(result.passiveNotes).toContain("✨ Lightbringer Base XP (+60 XP)");
        });
    });

    describe("Class Select Component Builder", () => {
        it("builds an ActionRow with interactive class select menu", () => {
            const dummyUser: User = {
                id: "u1",
                discord_id: "d1",
                project_id: "p1",
                display_name: "TestUser",
                xp: 1000,
                level: 5,
                streak: 1,
                max_streak: 1,
                character_class: "Gobbo",
                last_submission_date: null
            };

            const selectRow = createClassSelectRow(dummyUser);
            expect(selectRow).toBeDefined();
            expect(selectRow.components.length).toBe(1);
        });
    });
});
