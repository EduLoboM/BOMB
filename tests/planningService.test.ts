import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../src/supabase.js", () => {
    const mockTasks: any[] = [];
    const mockEvents: any[] = [];
    const mockHelpers: any[] = [];
    const mockRetroItems: any[] = [];
    const mockRetroVotes: any[] = [];

    return {
        supabase: {
            from: (table: string) => {
                if (table === "planned_tasks") {
                    return {
                        insert: (data: any) => ({
                            select: () => ({
                                single: async () => {
                                    const created = {
                                        id: `task-${Date.now()}-${Math.random()}`,
                                        project_id: data.project_id,
                                        creator_id: data.creator_id,
                                        title: data.title,
                                        description: data.description || null,
                                        points: data.points || 1,
                                        assignee_id: data.assignee_id || null,
                                        sprint_id: data.sprint_id || null,
                                        status: data.status || "planned",
                                        created_at: new Date().toISOString()
                                    };
                                    mockTasks.push(created);
                                    return { data: created, error: null };
                                }
                            })
                        }),
                        select: () => {
                            let filtered = [...mockTasks];
                            const chain = {
                                eq: (col: string, val: any) => {
                                    filtered = filtered.filter(item => item[col] === val);
                                    return chain;
                                },
                                order: () => chain,
                                then: (resolve: any) => resolve({ data: filtered, error: null })
                            };
                            return chain;
                        },
                        update: (payload: any) => ({
                            eq: (col: string, val: string) => ({
                                select: () => ({
                                    single: async () => {
                                        const task = mockTasks.find(t => t.id === val);
                                        if (task) {
                                            Object.assign(task, payload);
                                        }
                                        return { data: task, error: null };
                                    }
                                })
                            })
                        })
                    };
                }
                if (table === "planned_events") {
                    return {
                        insert: (data: any) => ({
                            select: () => ({
                                single: async () => {
                                    const created = {
                                        id: `event-${Date.now()}-${Math.random()}`,
                                        project_id: data.project_id,
                                        creator_id: data.creator_id,
                                        title: data.title,
                                        event_date: data.event_date,
                                        event_type: data.event_type || "meeting",
                                        description: data.description || null,
                                        sprint_id: data.sprint_id || null,
                                        status: data.status || "scheduled",
                                        created_at: new Date().toISOString()
                                    };
                                    mockEvents.push(created);
                                    return { data: created, error: null };
                                }
                            })
                        }),
                        select: () => {
                            let filtered = [...mockEvents];
                            const chain = {
                                eq: (col: string, val: any) => {
                                    filtered = filtered.filter(item => item[col] === val);
                                    return chain;
                                },
                                order: () => chain,
                                then: (resolve: any) => resolve({ data: filtered, error: null })
                            };
                            return chain;
                        },
                        update: (payload: any) => ({
                            eq: (col: string, val: string) => ({
                                select: () => ({
                                    single: async () => {
                                        const evt = mockEvents.find(e => e.id === val);
                                        if (evt) {
                                            Object.assign(evt, payload);
                                        }
                                        return { data: evt, error: null };
                                    }
                                })
                            })
                        })
                    };
                }
                if (table === "discreet_help_requests") {
                    return {
                        insert: (data: any) => ({
                            select: () => ({
                                single: async () => {
                                    const created = {
                                        id: `help-${Date.now()}-${Math.random()}`,
                                        project_id: data.project_id,
                                        helper_id: data.helper_id,
                                        status: data.status || "available",
                                        note: data.note || null,
                                        created_at: new Date().toISOString()
                                    };
                                    mockHelpers.push(created);
                                    return { data: created, error: null };
                                }
                            })
                        }),
                        select: () => ({
                            eq: (col: string, val: string) => ({
                                eq: (col2: string, val2: string) => async () => ({
                                    data: mockHelpers.filter(h => h.project_id === val && h.status === val2),
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === "retrospective_items") {
                    return {
                        insert: (data: any) => ({
                            select: () => ({
                                single: async () => {
                                    const created = {
                                        id: `retro-${Date.now()}-${Math.random()}`,
                                        project_id: data.project_id,
                                        author_id: data.author_id,
                                        category: data.category,
                                        content: data.content,
                                        sprint_id: data.sprint_id || null,
                                        upvotes: data.upvotes || 0,
                                        status: data.status || "open",
                                        created_at: new Date().toISOString()
                                    };
                                    mockRetroItems.push(created);
                                    return { data: created, error: null };
                                }
                            })
                        }),
                        select: () => {
                            let filtered = [...mockRetroItems];
                            const chain = {
                                eq: (col: string, val: any) => {
                                    filtered = filtered.filter(item => item[col] === val);
                                    return chain;
                                },
                                order: () => chain,
                                then: (resolve: any) => resolve({ data: filtered, error: null })
                            };
                            return chain;
                        },
                        update: (payload: any) => ({
                            eq: (col: string, val: string) => ({
                                eq: async () => {
                                    mockRetroItems.forEach(r => {
                                        if (r.project_id === val) Object.assign(r, payload);
                                    });
                                    return { data: null, error: null };
                                }
                            })
                        })
                    };
                }
                return {
                    select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
                };
            },
            rpc: async () => ({ data: null, error: null })
        }
    };
});

vi.mock("../src/services/gamificationService.js", () => ({
    gamificationService: {
        addXP: vi.fn().mockResolvedValue({ level: 1, xp: 100 })
    }
}));

import { planningService } from "../src/services/planningService.js";

describe("planningService", () => {
    const projectId = "proj-123";
    const userId = "user-456";
    const sprintId = "sprint-789";

    it("should create a planned task", async () => {
        const task = await planningService.createTask(
            projectId,
            userId,
            "Implement Auth",
            "OAuth 2.0 implementation",
            3,
            userId,
            sprintId
        );

        expect(task.title).toBe("Implement Auth");
        expect(task.points).toBe(3);
        expect(task.assignee_id).toBe(userId);
        expect(task.status).toBe("planned");
    });

    it("should update task status to completed", async () => {
        const task = await planningService.createTask(projectId, userId, "Refactor Tests", undefined, 2, userId, sprintId);
        const updated = await planningService.updateTaskStatus(task.id, "completed", "Done ahead of time");

        expect(updated).not.toBeNull();
        expect(updated?.status).toBe("completed");
        expect(updated?.review_notes).toBe("Done ahead of time");
        expect(updated?.completed_at).toBeDefined();
    });

    it("should create a planned event", async () => {
        const event = await planningService.createEvent(
            projectId,
            userId,
            "Sprint Demo",
            "2026-08-05T15:00:00Z",
            "demo",
            "Showcase new features",
            sprintId
        );

        expect(event.title).toBe("Sprint Demo");
        expect(event.event_type).toBe("demo");
        expect(event.status).toBe("scheduled");
    });

    it("should register discreet peer help availability ('Mão Amiga')", async () => {
        const helpOffer = await planningService.offerDiscreetHelp(projectId, userId, "Finished my tasks!");

        expect(helpOffer.helper_id).toBe(userId);
        expect(helpOffer.status).toBe("available");
    });

    it("should calculate sprint review summary and conclude review with XP awards", async () => {
        const task1 = await planningService.createTask(projectId, userId, "Task A", undefined, 3, userId, sprintId);
        await planningService.updateTaskStatus(task1.id, "completed");

        const review = await planningService.concludeSprintReview(projectId, sprintId, "Great sprint!");

        expect(review.summary.totalTasks).toBeGreaterThan(0);
        expect(review.summary.completedTasks).toBeGreaterThan(0);
        expect(review.awardedUsers.length).toBeGreaterThan(0);
        expect(review.summaryNotes).toBe("Great sprint!");
    });

    it("should add retrospective items and conclude retrospective", async () => {
        const item1 = await planningService.addRetroItem(projectId, userId, "went_well", "Great communication!", sprintId);
        const item2 = await planningService.addRetroItem(projectId, userId, "action_item", "Improve PR reviews", sprintId);

        expect(item1.category).toBe("went_well");
        expect(item2.category).toBe("action_item");

        const retroConclusion = await planningService.concludeRetro(projectId, sprintId);
        expect(retroConclusion.wentWell.length).toBeGreaterThan(0);
        expect(retroConclusion.actionItems.length).toBeGreaterThan(0);
    });
});
