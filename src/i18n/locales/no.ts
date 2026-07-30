import type { pt } from "./pt.js";

export const no: typeof pt = {
    common: {
        success: "Suksess",
        error: "Feil",
        warning: "Advarsel",
        info: "Informasjon",
        none: "Ingen",
        cancel: "Avbryt",
        submit: "Send inn",
        guild: "Laug",
    },
    language: {
        title: "🌍 Språkinnstilling",
        updated: "✅ Prosjektspråk endret til **{language}**!",
        invalid: "❌ Ugyldig språk. Velg mellom: pt, en, es, de-CH, no.",
        current: "Gjeldende språk for prosjektet **{project}** er **{language}**.",
        selectPrompt: "Velg ønsket språk for denne serveren:"
    },
    project: {
        created: "✅ Prosjekt **{name}** opprettet!\nTilgangskode: `{code}`",
        joined: "🎉 Du har blitt med i prosjektet **{name}**!",
        notFound: "❌ Prosjekt ikke funnet for denne serveren.",
        alreadyJoined: "⚠️ Du er allerede medlem av dette prosjektet.",
        accessCode: "Tilgangskode",
        members: "Medlemmer",
        statusTitle: "🏰 Prosjektstatus — {name}",
        statusDesc: "Lauginformasjon og sprintinnstillinger.",
        deleted: "🎯 Prosjekt **{name}** fullført og slettet med suksess."
    },
    daily: {
        journalTitle: "📜  Ekspedisjonsdagbok  —  {date}",
        header: "⚔️ **Daglig Standup-rapport**",
        prompt: "▸ Bruk `/daily` eller klikk på knappen nedenfor for å sende inn din rapport.",
        done: "Gjort",
        todo: "Skal gjøres",
        blockers: "Blokkeringer",
        pendingMembers: "⏳ Ventende medlemmer ({count})",
        allSubmitted: "🎉 Alle medlemmer har levert dagens dagbok!",
        submitButton: "📝 Send inn dagbok",
        openTitle: "⏰ Daglig rapport åpen!",
        openDesc: "Vinduet for daglig standup er åpent i **{period}** minutter.",
        closedTitle: "⏳ Dagbok stengt",
        closedDesc: "Innsending for dagens rapport er nå stengt.",
        modalTitle: "📜 Ekspedisjonsdagbok",
        modalDoneLabel: "Hva gjorde du i går/i dag?",
        modalTodoLabel: "Hva skal du gjøre i dag/i morgen?",
        modalBlockersLabel: "Noen hindringer/blokkeringer?",
        submitted: "✅ Din dagbok ble registrert! +{xp} XP tildelt."
    },
    profile: {
        title: "📜 Eventyrerprofil — {name}",
        level: "Nivå",
        xp: "Erfaring (XP)",
        streak: "Daglig rekke (Streak)",
        class: "RPG-klasse",
        hexad: "Hexad-profil",
        streakProtected: "🛡️ Rekkebeskyttelse er aktiv!",
        badges: "Prestasjoner og merker"
    },
    leaderboard: {
        title: "🏆 Laug-poengtavle — {project}",
        rank: "Plassering",
        name: "Eventyrer",
        xp: "Total XP",
        streak: "Rekke"
    },
    classes: {
        title: "⚔️ RPG-Klasseoversikt",
        chosen: "🎉 Du valgte klassen **{class}**!",
        invalid: "❌ Klasse ikke funnet."
    },
    mascot: {
        title: "🐾 Laugets Maskot — {name}",
        currentMood: "Nåværende humør",
        level: "Nivå",
        xp: "XP",
        activeAura: "Aktiv aura",
        changed: "✅ Maskot endret til **{type}** ({name})!"
    },
    blockers: {
        title: "🚧 Hinder-oversikt",
        leaderView: "Leder-visning",
        memberView: "Min visning",
        activeBlockers: "Aktive hindringer",
        resolvedBlockers: "Løste hindringer",
        noBlockers: "Ingen aktive hindringer for øyeblikket! 🚀"
    },
    planning: {
        title: "🗺️ Sprintplanlegging",
        taskAdded: "✅ Oppgave **{title}** lagt til i planleggingen!",
        eventAdded: "✅ Hendelse **{title}** planlagt!",
        helpOffered: "🤝 Hjelpe-tilbud registrert!",
        helpRequested: "🆘 Hjelpe-forespørsel sendt!"
    },
    review: {
        title: "📊 Sprintgjennomgang",
        taskUpdated: "✅ Oppgavestatus oppdatert!",
        eventUpdated: "✅ Hendelsesstatus oppdatert!",
        completed: "🎉 Sprintgjennomgang fullført!"
    },
    retrospective: {
        title: "💡 Retrospektiv-tavle",
        itemAdded: "✅ Element lagt til i retrospektivet!",
        voted: "👍 Stemme registrert!",
        concluded: "🏁 Retrospektiv fullført!"
    }
};
