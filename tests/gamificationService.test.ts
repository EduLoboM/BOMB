import { vi, describe, it, expect } from "vitest";

vi.mock("../src/supabase.js", () => {
    return {
        supabase: {
            from: vi.fn()
        }
    };
});

import { gamificationService, CLASS_REGISTRY } from "../src/services/gamificationService.js";
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
    });

    describe("Class Evolutions", () => {
        it("identifies Tier 1 evolution eligibility at Level 5", () => {
            const evosLevel4 = gamificationService.getAvailableEvolutions("Gobbo", 4);
            expect(evosLevel4).toEqual([]);

            const evosLevel5 = gamificationService.getAvailableEvolutions("Gobbo", 5);
            expect(evosLevel5).toEqual(["Angel Gobbo"]);
        });

        it("identifies Tier 2 evolution eligibility at Level 15", () => {
            const evosLevel14 = gamificationService.getAvailableEvolutions("Angel Gobbo", 14);
            expect(evosLevel14).toEqual([]);

            const evosLevel15 = gamificationService.getAvailableEvolutions("Angel Gobbo", 15);
            expect(evosLevel15).toEqual(["Angel"]);
        });

        it("handles 2-form evolution chains requiring Level 15 (Mooladin & Scissorpaw)", () => {
            expect(gamificationService.getAvailableEvolutions("Mooladin", 5)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Mooladin", 15)).toEqual(["Heretic Mooladin"]);
            expect(gamificationService.getAvailableEvolutions("Scissorpaw", 5)).toEqual([]);
            expect(gamificationService.getAvailableEvolutions("Scissorpaw", 15)).toEqual(["Fox Musketeer"]);
        });
    });

    describe("Daily Submission Processing", () => {
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
                true, // isFirstSubmissionToday
                true, // hasNoBlockers
                "Worked on features",
                "Testing code"
            );

            expect(result.xpGained).toBeGreaterThan(100);
            expect(result.newStreak).toBe(1);
            expect(result.passiveNotes).toContain("🗡️ First Strike Bonus (+50% XP)");
        });
    });
});
