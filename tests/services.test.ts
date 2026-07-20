import { vi, describe, it, expect } from "vitest";
import { supabase } from "../src/supabase.js";

vi.mock("../src/supabase.js", () => {
    return {
        supabase: {
            from: vi.fn()
        }
    };
});

import { projectService } from "../src/services/projectService.js";
import { userService } from "../src/services/userService.js";
import { sprintService } from "../src/services/sprintService.js";
import { dailyService } from "../src/services/dailyService.js";

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
    lte = vi.fn().mockReturnThis();
    gte = vi.fn().mockReturnThis();
    not = vi.fn().mockReturnThis();
    order = vi.fn().mockReturnThis();
    limit = vi.fn().mockReturnThis();
    returns = vi.fn().mockReturnThis();
    single = vi.fn().mockImplementation(() => Promise.resolve({ data: this.dataVal, error: this.errorVal }));
    maybeSingle = vi.fn().mockImplementation(() => Promise.resolve({ data: this.dataVal, error: this.errorVal }));
    
    then(onfulfilled: any) {
        return Promise.resolve({ data: this.dataVal, error: this.errorVal }).then(onfulfilled);
    }
}

describe("Database Services Testing", () => {
    const mockFrom = vi.mocked(supabase.from);

    describe("projectService", () => {
        it("getProjectByGuild - Happy Path", async () => {
            const projectMock = { id: "p1", name: "BOMB", guild_id: "g1" };
            mockFrom.mockImplementation(() => new MockSupabaseQuery(projectMock, null) as any);

            const res = await projectService.getProjectByGuild("g1");
            expect(res).toEqual(projectMock);
            expect(mockFrom).toHaveBeenCalledWith("projects");
        });

        it("getProjectByGuild - Sad Path (DB Error)", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, new Error("DB Connection Error")) as any);

            await expect(projectService.getProjectByGuild("g1")).rejects.toThrow("DB Connection Error");
        });

        it("createProject - Happy Path", async () => {
            const newProject = { id: "p2", name: "Alpha", guild_id: "g2", access_code: "XYZ123" };
            mockFrom.mockImplementation(() => new MockSupabaseQuery(newProject, null) as any);

            const res = await projectService.createProject("Alpha", "g2", "XYZ123");
            expect(res).toEqual(newProject);
        });

        it("createProject - Sad Path (Constraint Failure)", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, new Error("Unique constraint violated")) as any);

            await expect(projectService.createProject("Alpha", "g2", "XYZ123")).rejects.toThrow("Unique constraint violated");
        });
    });

    describe("userService", () => {
        it("getProjectMembers - Happy Path", async () => {
            const membersMock = [
                { id: "u1", discord_id: "d1", display_name: "Alice" },
                { id: "u2", discord_id: "d2", display_name: "Bob" }
            ];
            mockFrom.mockImplementation(() => new MockSupabaseQuery(membersMock, null) as any);

            const res = await userService.getProjectMembers("p1");
            expect(res).toEqual(membersMock);
            expect(mockFrom).toHaveBeenCalledWith("users");
        });

        it("getProjectMembers - Sad Path", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, new Error("User table not found")) as any);

            await expect(userService.getProjectMembers("p1")).rejects.toThrow("User table not found");
        });
    });

    describe("sprintService", () => {
        it("getSprints - Happy Path", async () => {
            const sprintsMock = [
                { id: "s1", project_id: "p1", number: 1, start_date: "2026-07-20", end_date: "2026-07-27" }
            ];
            mockFrom.mockImplementation(() => new MockSupabaseQuery(sprintsMock, null) as any);

            const res = await sprintService.getSprints("p1");
            expect(res).toEqual(sprintsMock);
            expect(mockFrom).toHaveBeenCalledWith("sprints");
        });

        it("getSprints - Sad Path", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, new Error("Sprint query failed")) as any);

            await expect(sprintService.getSprints("p1")).rejects.toThrow("Sprint query failed");
        });
    });

    describe("dailyService", () => {
        it("createDaily - Happy Path", async () => {
            const dailyMock = { id: "d1", user_id: "u1", project_id: "p1" };
            mockFrom.mockImplementation(() => new MockSupabaseQuery(dailyMock, null) as any);

            const res = await dailyService.createDaily("u1", "p1", "done content", "todo content", "blocker content");
            expect(res).toBeUndefined();
            expect(mockFrom).toHaveBeenCalledWith("dailies");
        });

        it("createDaily - Sad Path", async () => {
            mockFrom.mockImplementation(() => new MockSupabaseQuery(null, new Error("Failed to insert daily")) as any);

            await expect(
                dailyService.createDaily("u1", "p1", "done content", "todo content", "blocker content")
            ).rejects.toThrow("Failed to insert daily");
        });
    });
});
