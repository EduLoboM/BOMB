import type { pt } from "./pt.js";

export const en: typeof pt = {
    common: {
        success: "Success",
        error: "Error",
        warning: "Warning",
        info: "Information",
        none: "None",
        cancel: "Cancel",
        submit: "Submit",
        guild: "Guild",
    },
    language: {
        title: "🌍 Language Configuration",
        updated: "✅ Project language changed to **{language}**!",
        invalid: "❌ Invalid language. Choose between: pt, en, es, de-CH, no.",
        current: "The current language of project **{project}** is **{language}**.",
        selectPrompt: "Select the desired language for this server:"
    },
    project: {
        created: "✅ Project **{name}** created successfully!\nAccess code: `{code}`",
        joined: "🎉 You joined project **{name}**!",
        notFound: "❌ Project not found for this server.",
        alreadyJoined: "⚠️ You are already a member of this project.",
        accessCode: "Access Code",
        members: "Members",
        statusTitle: "🏰 Project Status — {name}",
        statusDesc: "Guild information and sprint settings.",
        deleted: "🎯 Project **{name}** completed and removed successfully."
    },
    daily: {
        journalTitle: "📜  Expedition Journal  —  {date}",
        header: "⚔️ **Daily Standup Report**",
        prompt: "▸ Use `/daily` or click the button below to submit your report.",
        done: "Done",
        todo: "To Do",
        blockers: "Blockers",
        pendingMembers: "⏳ Pending Members ({count})",
        allSubmitted: "🎉 All members have submitted today's standup!",
        submitButton: "📝 Submit Daily",
        openTitle: "⏰ Daily Report Open!",
        openDesc: "The Daily standup window is open for **{period}** minutes.",
        closedTitle: "⏳ Daily Closed",
        closedDesc: "The Daily standup submission window for today is closed.",
        modalTitle: "📜 Expedition Journal",
        modalDoneLabel: "What did you do yesterday/today?",
        modalTodoLabel: "What will you do today/tomorrow?",
        modalBlockersLabel: "Any impediments/blockers?",
        submitted: "✅ Your standup was recorded successfully! +{xp} XP granted."
    },
    profile: {
        title: "📜 Adventurer Profile — {name}",
        level: "Level",
        xp: "Experience (XP)",
        streak: "Daily Streak",
        class: "RPG Class",
        hexad: "Hexad Profile",
        streakProtected: "🛡️ Streak Protection active!",
        badges: "Achievements & Badges"
    },
    leaderboard: {
        title: "🏆 Guild Leaderboard — {project}",
        rank: "Rank",
        name: "Adventurer",
        xp: "Total XP",
        streak: "Streak"
    },
    classes: {
        title: "⚔️ RPG Class Directory",
        chosen: "🎉 You chose the **{class}** class!",
        invalid: "❌ Class not found."
    },
    mascot: {
        title: "🐾 Guild Mascot — {name}",
        currentMood: "Current Mood",
        level: "Level",
        xp: "XP",
        activeAura: "Active Aura",
        changed: "✅ Mascot changed to **{type}** ({name})!"
    },
    blockers: {
        title: "🚧 Impediment Dashboard",
        leaderView: "Leader View",
        memberView: "My View",
        activeBlockers: "Active Impediments",
        resolvedBlockers: "Resolved Impediments",
        noBlockers: "No active impediments at the moment! 🚀"
    },
    planning: {
        title: "🗺️ Sprint Planning",
        taskAdded: "✅ Task **{title}** added to planning!",
        eventAdded: "✅ Event **{title}** scheduled!",
        helpOffered: "🤝 Peer help offer registered!",
        helpRequested: "🆘 Help request sent successfully!"
    },
    review: {
        title: "📊 Sprint Review",
        taskUpdated: "✅ Task status updated!",
        eventUpdated: "✅ Event status updated!",
        completed: "🎉 Sprint review completed!"
    },
    retrospective: {
        title: "💡 Retrospective Board",
        itemAdded: "✅ Item added to retrospective!",
        voted: "👍 Vote recorded!",
        concluded: "🏁 Retrospective finalized!"
    }
};
