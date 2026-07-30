import { supabase } from "../supabase.js";
import {
    PlannedTask,
    PlannedTaskWithDetails,
    PlannedEvent,
    PlannedEventWithDetails,
    RetrospectiveItem,
    RetrospectiveItemWithAuthor,
    DiscreetHelpRequest,
    DiscreetHelpRequestWithDetails,
    TaskStatus,
    EventStatus,
    EventType,
    RetroCategory,
    User
} from "../types.js";
import { Logger } from "../logger.js";
import { gamificationService } from "./gamificationService.js";
import { userService } from "./userService.js";

export const planningService = {
    async createTask(
        projectId: string,
        creatorId: string,
        title: string,
        description?: string,
        points: number = 1,
        assigneeId?: string,
        sprintId?: string
    ): Promise<PlannedTask> {
        const { data, error } = await supabase
            .from("planned_tasks")
            .insert({
                project_id: projectId,
                creator_id: creatorId,
                title,
                description: description || null,
                points: Math.max(1, points),
                assignee_id: assigneeId || null,
                sprint_id: sprintId || null,
                status: "planned",
            })
            .select()
            .single();

        if (error) {
            Logger.error("Failed to create planned task:", error);
            throw new Error(`Erro ao criar tarefa de planejamento: ${error.message}`);
        }

        return data as PlannedTask;
    },

    async getTasksForSprint(projectId: string, sprintId?: string): Promise<PlannedTaskWithDetails[]> {
        let query = supabase
            .from("planned_tasks")
            .select(`
                *,
                assignee:users!assignee_id(*),
                creator:users!creator_id(*)
            `)
            .eq("project_id", projectId);

        if (sprintId) {
            query = query.eq("sprint_id", sprintId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) {
            Logger.error("Failed to fetch planned tasks:", error);
            return [];
        }

        return (data || []).map((item: any) => ({
            ...item,
            assignee: item.assignee || null,
            creator: item.creator || null,
        }));
    },

    async assignTask(taskId: string, assigneeId: string | null): Promise<PlannedTask | null> {
        const { data, error } = await supabase
            .from("planned_tasks")
            .update({ assignee_id: assigneeId })
            .eq("id", taskId)
            .select()
            .single();

        if (error) {
            Logger.error(`Failed to assign task ${taskId}:`, error);
            return null;
        }

        return data as PlannedTask;
    },

    async updateTaskStatus(taskId: string, status: TaskStatus, reviewNotes?: string): Promise<PlannedTask | null> {
        const updatePayload: any = { status };
        if (reviewNotes !== undefined) {
            updatePayload.review_notes = reviewNotes;
        }
        if (status === "completed") {
            updatePayload.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from("planned_tasks")
            .update(updatePayload)
            .eq("id", taskId)
            .select()
            .single();

        if (error) {
            Logger.error(`Failed to update task status for ${taskId}:`, error);
            return null;
        }

        return data as PlannedTask;
    },

    async createEvent(
        projectId: string,
        creatorId: string,
        title: string,
        eventDate: string,
        eventType: EventType = "meeting",
        description?: string,
        sprintId?: string
    ): Promise<PlannedEvent> {
        const { data, error } = await supabase
            .from("planned_events")
            .insert({
                project_id: projectId,
                creator_id: creatorId,
                title,
                event_date: eventDate,
                event_type: eventType,
                description: description || null,
                sprint_id: sprintId || null,
                status: "scheduled",
            })
            .select()
            .single();

        if (error) {
            Logger.error("Failed to create planned event:", error);
            throw new Error(`Erro ao agendar evento: ${error.message}`);
        }

        return data as PlannedEvent;
    },

    async getEventsForSprint(projectId: string, sprintId?: string): Promise<PlannedEventWithDetails[]> {
        let query = supabase
            .from("planned_events")
            .select(`
                *,
                creator:users!creator_id(*)
            `)
            .eq("project_id", projectId);

        if (sprintId) {
            query = query.eq("sprint_id", sprintId);
        }

        const { data, error } = await query.order("event_date", { ascending: true });

        if (error) {
            Logger.error("Failed to fetch planned events:", error);
            return [];
        }

        return (data || []).map((item: any) => ({
            ...item,
            creator: item.creator || null,
        }));
    },

    async updateEventStatus(eventId: string, status: EventStatus, reviewNotes?: string): Promise<PlannedEvent | null> {
        const updatePayload: any = { status };
        if (reviewNotes !== undefined) {
            updatePayload.review_notes = reviewNotes;
        }

        const { data, error } = await supabase
            .from("planned_events")
            .update(updatePayload)
            .eq("id", eventId)
            .select()
            .single();

        if (error) {
            Logger.error(`Failed to update event status for ${eventId}:`, error);
            return null;
        }

        return data as PlannedEvent;
    },

    async offerDiscreetHelp(projectId: string, helperId: string, note?: string): Promise<DiscreetHelpRequest> {
        const { data, error } = await supabase
            .from("discreet_help_requests")
            .insert({
                project_id: projectId,
                helper_id: helperId,
                status: "available",
                note: note || "Terminei minhas tarefas e estou com a mão estendida para ajudar!",
            })
            .select()
            .single();

        if (error) {
            Logger.error("Failed to register discreet help availability:", error);
            throw new Error(`Erro ao registrar disponibilidade de ajuda: ${error.message}`);
        }

        await gamificationService.addXP(helperId, 25);
        await userService.awardBadge(
            helperId,
            "Guilda Aventureira",
            "Mão Amiga Prosocial — Ofereceu suporte aos companheiros de guilda ao concluir suas tarefas!",
            "🖐️"
        ).catch(() => null);

        return data as DiscreetHelpRequest;
    },

    async getActiveHelpers(projectId: string): Promise<DiscreetHelpRequestWithDetails[]> {
        const { data, error } = await supabase
            .from("discreet_help_requests")
            .select(`
                *,
                helper:users!helper_id(*),
                requester:users!requester_id(*),
                task:planned_tasks!task_id(*)
            `)
            .eq("project_id", projectId)
            .eq("status", "available");

        if (error) {
            Logger.error("Failed to fetch active helpers:", error);
            return [];
        }

        return (data || []).map((item: any) => ({
            ...item,
            helper: item.helper,
            requester: item.requester || null,
            task: item.task || null,
        }));
    },

    async requestDiscreetHelp(requestId: string, requesterId: string, taskId?: string): Promise<DiscreetHelpRequest | null> {
        const { data, error } = await supabase
            .from("discreet_help_requests")
            .update({
                requester_id: requesterId,
                task_id: taskId || null,
                status: "matched",
            })
            .eq("id", requestId)
            .select()
            .single();

        if (error) {
            Logger.error(`Failed to request discreet help for ${requestId}:`, error);
            return null;
        }

        return data as DiscreetHelpRequest;
    },

    async getSprintReviewSummary(projectId: string, sprintId?: string) {
        const [tasks, events] = await Promise.all([
            this.getTasksForSprint(projectId, sprintId),
            this.getEventsForSprint(projectId, sprintId),
        ]);

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === "completed").length;
        const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 1), 0);
        const completedPoints = tasks.filter(t => t.status === "completed").reduce((sum, t) => sum + (t.points || 1), 0);

        const totalEvents = events.length;
        const completedEvents = events.filter(e => e.status === "completed").length;

        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
        const eventCompletionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 100;

        return {
            tasks,
            events,
            totalTasks,
            completedTasks,
            totalPoints,
            completedPoints,
            totalEvents,
            completedEvents,
            taskCompletionRate,
            eventCompletionRate,
        };
    },

    async concludeSprintReview(projectId: string, sprintId?: string, summaryNotes?: string) {
        const summary = await this.getSprintReviewSummary(projectId, sprintId);
        const awardedUsers: { userId: string; xp: number; name: string }[] = [];

        for (const task of summary.tasks) {
            if (task.status === "completed" && task.assignee_id) {
                const xpGain = (task.points || 1) * 30 + 50;
                await gamificationService.addXP(task.assignee_id, xpGain);

                const existing = awardedUsers.find(u => u.userId === task.assignee_id);
                if (existing) {
                    existing.xp += xpGain;
                } else {
                    awardedUsers.push({
                        userId: task.assignee_id,
                        xp: xpGain,
                        name: task.assignee?.display_name || "Aventureiro",
                    });
                }
            }
        }

        if (summary.taskCompletionRate === 100 && summary.totalTasks > 0) {
            for (const userObj of awardedUsers) {
                await userService.awardBadge(
                    userObj.userId,
                    "Guilda Aventureira",
                    "Expedição Perfeita — A guilda alcançou 100% de conclusão de tarefas planejadas no sprint!",
                    "🏆"
                ).catch(() => null);
            }
        }

        return {
            summary,
            awardedUsers,
            summaryNotes: summaryNotes || "Revisão de tarefas e eventos concluída com sucesso!",
        };
    },

    async addRetroItem(
        projectId: string,
        authorId: string,
        category: RetroCategory,
        content: string,
        sprintId?: string
    ): Promise<RetrospectiveItem> {
        const { data, error } = await supabase
            .from("retrospective_items")
            .insert({
                project_id: projectId,
                author_id: authorId,
                category,
                content,
                sprint_id: sprintId || null,
                upvotes: 0,
                status: "open",
            })
            .select()
            .single();

        if (error) {
            Logger.error("Failed to add retro item:", error);
            throw new Error(`Erro ao adicionar item na retrospectiva: ${error.message}`);
        }

        const xpAmount = category === "action_item" ? 25 : 15;
        await gamificationService.addXP(authorId, xpAmount);

        if (category === "action_item") {
            await userService.awardBadge(
                authorId,
                "Guilda Aventureira",
                "Mestre Tático — Formulou uma Ação/Ideia para evoluir a guilda no próximo sprint!",
                "💡"
            ).catch(() => null);
        }

        return data as RetrospectiveItem;
    },

    async getRetroItems(projectId: string, currentUserId?: string, sprintId?: string): Promise<RetrospectiveItemWithAuthor[]> {
        let query = supabase
            .from("retrospective_items")
            .select(`
                *,
                author:users!author_id(*)
            `)
            .eq("project_id", projectId);

        if (sprintId) {
            query = query.eq("sprint_id", sprintId);
        }

        const { data: items, error } = await query.order("upvotes", { ascending: false }).order("created_at", { ascending: true });

        if (error) {
            Logger.error("Failed to fetch retro items:", error);
            return [];
        }

        if (!currentUserId || !items || items.length === 0) {
            return (items || []).map((i: any) => ({
                ...i,
                author: i.author || null,
                has_voted: false,
            }));
        }

        const itemIds = items.map((i: any) => i.id);
        const { data: votes } = await supabase
            .from("retrospective_votes")
            .select("item_id")
            .eq("user_id", currentUserId)
            .in("item_id", itemIds);

        const votedSet = new Set((votes || []).map(v => v.item_id));

        return items.map((i: any) => ({
            ...i,
            author: i.author || null,
            has_voted: votedSet.has(i.id),
        }));
    },

    async voteRetroItem(itemId: string, userId: string): Promise<{ success: boolean; newUpvotes: number; voted: boolean }> {
        const { data: existingVote } = await supabase
            .from("retrospective_votes")
            .select("id")
            .eq("item_id", itemId)
            .eq("user_id", userId)
            .maybeSingle();

        if (existingVote) {
            await supabase.from("retrospective_votes").delete().eq("id", existingVote.id);
            try {
                await supabase.rpc("decrement_retro_upvote", { item_uuid: itemId });
            } catch {
            }

            const { data: updated } = await supabase
                .from("retrospective_items")
                .select("upvotes")
                .eq("id", itemId)
                .single();

            const currentUpvotes = Math.max(0, (updated?.upvotes || 1) - 1);
            await supabase.from("retrospective_items").update({ upvotes: currentUpvotes }).eq("id", itemId);

            return { success: true, newUpvotes: currentUpvotes, voted: false };
        } else {
            await supabase.from("retrospective_votes").insert({ item_id: itemId, user_id: userId });

            const { data: updated } = await supabase
                .from("retrospective_items")
                .select("upvotes")
                .eq("id", itemId)
                .single();

            const currentUpvotes = (updated?.upvotes || 0) + 1;
            await supabase.from("retrospective_items").update({ upvotes: currentUpvotes }).eq("id", itemId);

            return { success: true, newUpvotes: currentUpvotes, voted: true };
        }
    },

    async concludeRetro(projectId: string, sprintId?: string, summaryNotes?: string) {
        const items = await this.getRetroItems(projectId, undefined, sprintId);
        const actionItems = items.filter(i => i.category === "action_item");
        const wentWell = items.filter(i => i.category === "went_well");
        const toImprove = items.filter(i => i.category === "to_improve");

        if (items.length > 0) {
            await supabase
                .from("retrospective_items")
                .update({ status: "addressed" })
                .eq("project_id", projectId)
                .eq("status", "open");
        }

        return {
            items,
            wentWell,
            toImprove,
            actionItems,
            summaryNotes: summaryNotes || "Retrospectiva concluída! Ações registradas para a próxima jornada.",
        };
    }
};
