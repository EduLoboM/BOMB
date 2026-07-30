import type { pt } from "./pt.js";

export const deCH: typeof pt = {
    common: {
        success: "Erfolg",
        error: "Fehler",
        warning: "Warnung",
        info: "Information",
        none: "Kéis",
        cancel: "Abbräche",
        submit: "Abschicken",
        guild: "Gilde",
    },
    language: {
        title: "🌍 Schprooch-Yschtelig",
        updated: "✅ Projekt-Schprooch isch uf **{language}** gänderet worde!",
        invalid: "❌ Ungültigi Schprooch. Wähl us: pt, en, es, de-CH, no.",
        current: "D'aktuelle Schprooch vom Projekt **{project}** isch **{language}**.",
        selectPrompt: "Wähl die gwünschti Schprooch für dä Server us:"
    },
    project: {
        created: "✅ Projekt **{name}** erfolgreich erschtellt!\nZugangs-Code: `{code}`",
        joined: "🎉 Du bisch im Projekt **{name}** biitrette!",
        notFound: "❌ Ké Projekt für dä Server gfunde.",
        alreadyJoined: "⚠️ Du bisch schon es Mitglied vo däm Projekt.",
        accessCode: "Zugangs-Code",
        members: "Mitglieder",
        statusTitle: "🏰 Projekt-Schtand — {name}",
        statusDesc: "Gilde-Informatione und Sprint-Yschtelige.",
        deleted: "🎯 Projekt **{name}** erfolgreich abgschlosse und glöscht."
    },
    daily: {
        journalTitle: "📜  Expeditions-Tagebuch  —  {date}",
        header: "⚔️ **Täglichi Standup-Zämenfassig**",
        prompt: "▸ Bruuch `/daily` oder klick uf de Chnopf une zum de Bricht abschicke.",
        done: "Gmacht",
        todo: "Z'tue",
        blockers: "Blockade / Hindernis",
        pendingMembers: "⏳ Usschtehendi Mitglieder ({count})",
        allSubmitted: "🎉 Alli Mitglieder händ hüt s Tagebuch ikreicht!",
        submitButton: "📝 Tagebuch Abschicke",
        openTitle: "⏰ Täglichs Tagebuch Offe!",
        openDesc: "Das Igaab-Fänschter isch für **{period}** Minute offe.",
        closedTitle: "⏳ Daily Gschlosse",
        closedDesc: "D Daily-Igaab für hüt isch gschlosse.",
        modalTitle: "📜 Expeditions-Tagebuch",
        modalDoneLabel: "Was häsch gschter / hüt gmacht?",
        modalTodoLabel: "Was machsch hüt / morn?",
        modalBlockersLabel: "Gits irgendwelchi Hindernis?",
        submitted: "✅ Dis Tagebuch isch erfolgreich treit worde! +{xp} XP übercho."
    },
    profile: {
        title: "📜 Abenteurer-Profil — {name}",
        level: "Stufe",
        xp: "Erfahrig (XP)",
        streak: "Täglichi Strähni",
        class: "RPG-Klasse",
        hexad: "Hexad-Profil",
        streakProtected: "🛡️ Strähni-Schutz isch aktiv!",
        badges: "Erfolge & Badges"
    },
    leaderboard: {
        title: "🏆 Gilde-Ranglischte — {project}",
        rank: "Rang",
        name: "Abenteurer",
        xp: "Gsamte XP",
        streak: "Strähni"
    },
    classes: {
        title: "⚔️ RPG-Klassenverzeichnis",
        chosen: "🎉 Du häsch d Klasse **{class}** gewählt!",
        invalid: "❌ Klasse nöd gfunde."
    },
    mascot: {
        title: "🐾 Gilde-Maskottli — {name}",
        currentMood: "Aktuelle Luune",
        level: "Stufe",
        xp: "XP",
        activeAura: "Aktivi Aura",
        changed: "✅ Maskottli gändet zu **{type}** ({name})!"
    },
    blockers: {
        title: "🚧 Hindernis-Dashboard",
        leaderView: "Leiter-Sicht",
        memberView: "Myni Sicht",
        activeBlockers: "Aktivi Hindernis",
        resolvedBlockers: "Glösti Hindernis",
        noBlockers: "Kei aktivi Hindernis im Moment! 🚀"
    },
    planning: {
        title: "🗺️ Sprint-Planig",
        taskAdded: "✅ Aufgabe **{title}** zunere Planig hinzugefügt!",
        eventAdded: "✅ Event **{title}** plaant!",
        helpOffered: "🤝 Hilfsangebot isch treit worde!",
        helpRequested: "🆘 Hilfsanfråg erfolgreich verschickt!"
    },
    review: {
        title: "📊 Sprint-Review",
        taskUpdated: "✅ Aufgaben-Status aktualisiert!",
        eventUpdated: "✅ Event-Status aktualisiert!",
        completed: "🎉 Sprint-Review abgschlosse!"
    },
    retrospective: {
        title: "💡 Retrospektiv-Bort",
        itemAdded: "✅ Punkt zur Retrospektive hinzugefügt!",
        voted: "👍 Stimm treit!",
        concluded: "🏁 Retrospektive beendet!"
    }
};
