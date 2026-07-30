import { vi, describe, it, expect, beforeEach } from "vitest";
import { supabase } from "../src/supabase.js";

vi.mock("../src/supabase.js", () => {
    return {
        supabase: {
            from: vi.fn()
        }
    };
});

import { impedimentService, isNoBlockerText } from "../src/services/impedimentService.js";

class MockSupabaseQuery {
    private dataVal: any;
    private errorVal: any;

    constructor(data: any, error: any) {
        this.dataVal = data;
        this.errorVal = error;
    }

    select = vi.fn().mockReturnThis();
    insert = vi.fn().mockReturnThis();
    update = vi.fn().mockReturnThis();
    delete = vi.fn().mockReturnThis();
    eq = vi.fn().mockReturnThis();
    in = vi.fn().mockReturnThis();
    lte = vi.fn().mockReturnThis();
    gte = vi.fn().mockReturnThis();
    order = vi.fn().mockReturnThis();
    limit = vi.fn().mockReturnThis();
    single = vi.fn().mockImplementation(() => Promise.resolve({ data: this.dataVal, error: this.errorVal }));
    maybeSingle = vi.fn().mockImplementation(() => Promise.resolve({ data: this.dataVal, error: this.errorVal }));

    then(onfulfilled: any) {
        return Promise.resolve({ data: this.dataVal, error: this.errorVal }).then(onfulfilled);
    }
}

describe("impedimentService", () => {
    const mockFrom = vi.mocked(supabase.from);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("isNoBlockerText helper", () => {
        it("identifies empty, none, or portuguese variants as no blocker", () => {
            expect(isNoBlockerText("")).toBe(true);
            expect(isNoBlockerText("None")).toBe(true);
            expect(isNoBlockerText("Nenhum")).toBe(true);
            expect(isNoBlockerText("N/A")).toBe(true);
            expect(isNoBlockerText("sem obstáculos")).toBe(true);
            expect(isNoBlockerText("-")).toBe(true);
            expect(isNoBlockerText("Aguardando backend")).toBe(false);
        });
    });

    describe("recordStandupBlocker", () => {
        it("resolves active blockers when standup contains no blockers", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery([], null) as any);

            const result = await impedimentService.recordStandupBlocker("u1", "p1", "d1", "Nenhum");
            expect(result.impediment).toBeNull();
            expect(result.isStreakAlert).toBe(false);
            expect(result.blockStreak).toBe(0);
            expect(mockFrom).toHaveBeenCalledWith("impediments");
        });

        it("creates a new active impediment on first blocker submission", async () => {
            const newImp = {
                id: "imp1",
                user_id: "u1",
                project_id: "p1",
                daily_id: "d1",
                description: "Waiting for database setup",
                status: "active",
                block_streak: 1,
            };

            let callCount = 0;
            mockFrom.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return new MockSupabaseQuery(null, null) as any;
                }
                return new MockSupabaseQuery(newImp, null) as any;
            });

            const result = await impedimentService.recordStandupBlocker("u1", "p1", "d1", "Waiting for database setup");
            expect(result.impediment).toEqual(newImp);
            expect(result.blockStreak).toBe(1);
            expect(result.isStreakAlert).toBe(false);
        });

        it("increments block streak and triggers streak alert when streak reaches 2+", async () => {
            const activeImp = {
                id: "imp1",
                user_id: "u1",
                project_id: "p1",
                description: "Day 1 blocker",
                status: "active",
                block_streak: 1,
            };

            const updatedImp = {
                ...activeImp,
                description: "Day 2 blocker still stuck",
                block_streak: 2,
            };

            let callCount = 0;
            mockFrom.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return new MockSupabaseQuery(activeImp, null) as any;
                }
                return new MockSupabaseQuery(updatedImp, null) as any;
            });

            const result = await impedimentService.recordStandupBlocker("u1", "p1", "d2", "Day 2 blocker still stuck");
            expect(result.blockStreak).toBe(2);
            expect(result.isStreakAlert).toBe(true);
        });
    });

    describe("assignHelper and resolveImpediment", () => {
        it("assigns helper and updates status to in_assistance", async () => {
            const imp = {
                id: "imp1",
                user_id: "u1",
                project_id: "p1",
                description: "Stuck on CORS",
                status: "in_assistance",
                helper_id: "u2",
                user: { discord_id: "123", display_name: "Alice" },
                helper: { discord_id: "456", display_name: "Bob" }
            };

            mockFrom.mockImplementation(() => new MockSupabaseQuery(imp, null) as any);

            const res = await impedimentService.assignHelper("imp1", "u2");
            expect(res?.status).toBe("in_assistance");
        });

        it("resolves impediment successfully", async () => {
            const imp = {
                id: "imp1",
                user_id: "u1",
                project_id: "p1",
                description: "Resolved issue",
                status: "resolved",
                helper_id: "u2",
                user: { discord_id: "123", display_name: "Alice" },
                helper: { discord_id: "456", display_name: "Bob" }
            };

            mockFrom.mockImplementation(() => new MockSupabaseQuery(imp, null) as any);

            const res = await impedimentService.resolveImpediment("imp1", "u2");
            expect(res?.status).toBe("resolved");
        });
    });
});
