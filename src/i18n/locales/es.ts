import type { pt } from "./pt.js";

export const es: typeof pt = {
    common: {
        success: "Éxito",
        error: "Error",
        warning: "Advertencia",
        info: "Información",
        none: "Ninguno",
        cancel: "Cancelar",
        submit: "Enviar",
        guild: "Gremio",
    },
    language: {
        title: "🌍 Configuración de Idioma",
        updated: "✅ ¡Idioma del proyecto cambiado a **{language}**!",
        invalid: "❌ Idioma no válido. Elige entre: pt, en, es, de-CH, no.",
        current: "El idioma actual del proyecto **{project}** es **{language}**.",
        selectPrompt: "Selecciona el idioma deseado para este servidor:"
    },
    project: {
        created: "✅ ¡Proyecto **{name}** creado con éxito!\nCódigo de acceso: `{code}`",
        joined: "🎉 ¡Te has unido al proyecto **{name}**!",
        notFound: "❌ Proyecto no encontrado para este servidor.",
        alreadyJoined: "⚠️ Ya eres miembro de este proyecto.",
        accessCode: "Código de Acceso",
        members: "Miembros",
        statusTitle: "🏰 Estado del Proyecto — {name}",
        statusDesc: "Información del gremio y configuración del sprint.",
        deleted: "🎯 Proyecto **{name}** finalizado y eliminado con éxito."
    },
    daily: {
        journalTitle: "📜  Diario de la Expedición  —  {date}",
        header: "⚔️ **Informe Diario de Standup**",
        prompt: "▸ Usa `/daily` o haz clic en el botón de abajo para enviar tu informe.",
        done: "Hecho",
        todo: "Por Hacer",
        blockers: "Obstáculos",
        pendingMembers: "⏳ Miembros Pendientes ({count})",
        allSubmitted: "🎉 ¡Todos los miembros enviaron el diario de hoy!",
        submitButton: "📝 Enviar Diario",
        openTitle: "⏰ ¡Informe Diario Abierto!",
        openDesc: "La ventana de envío de Daily está abierta por **{period}** minutos.",
        closedTitle: "⏳ Daily Cerrada",
        closedDesc: "La ventana de envío de Daily para hoy está cerrada.",
        modalTitle: "📜 Diario de Expedición",
        modalDoneLabel: "¿Qué hiciste ayer/hoy?",
        modalTodoLabel: "¿Qué harás hoy/mañana?",
        modalBlockersLabel: "¿Algún impedimento/bloqueo?",
        submitted: "✅ ¡Tu diario ha sido registrado con éxito! +{xp} XP otorgados."
    },
    profile: {
        title: "📜 Perfil de Aventurero — {name}",
        level: "Nivel",
        xp: "Experiencia (XP)",
        streak: "Racha de Dailies",
        class: "Clase RPG",
        hexad: "Perfil Hexad",
        streakProtected: "🛡️ ¡Protección de Racha activa!",
        badges: "Logros y Medallas"
    },
    leaderboard: {
        title: "🏆 Clasificación del Gremio — {project}",
        rank: "Posición",
        name: "Aventurero",
        xp: "XP Total",
        streak: "Racha"
    },
    classes: {
        title: "⚔️ Directorio de Clases RPG",
        chosen: "🎉 ¡Elegiste la clase **{class}**!",
        invalid: "❌ Clase no encontrada."
    },
    mascot: {
        title: "🐾 Mascota del Gremio — {name}",
        currentMood: "Estado de Ánimo",
        level: "Nivel",
        xp: "XP",
        activeAura: "Aura Activa",
        changed: "✅ ¡Mascota cambiada a **{type}** ({name})!"
    },
    blockers: {
        title: "🚧 Panel de Impedimentos",
        leaderView: "Vista de Líder",
        memberView: "Mi Vista",
        activeBlockers: "Impedimentos Activos",
        resolvedBlockers: "Impedimentos Resueltos",
        noBlockers: "¡No hay impedimentos activos en este momento! 🚀"
    },
    planning: {
        title: "🗺️ Planificación del Sprint",
        taskAdded: "✅ ¡Tarea **{title}** añadida a la planificación!",
        eventAdded: "✅ ¡Evento **{title}** programado!",
        helpOffered: "🤝 ¡Oferta de ayuda registrada!",
        helpRequested: "🆘 ¡Solicitud de ayuda enviada con éxito!"
    },
    review: {
        title: "📊 Revisión del Sprint",
        taskUpdated: "✅ ¡Estado de la tarea actualizado!",
        eventUpdated: "✅ ¡Estado del evento actualizado!",
        completed: "🎉 ¡Revisión del sprint completada!"
    },
    retrospective: {
        title: "💡 Tablero de Retrospectiva",
        itemAdded: "✅ ¡Elemento añadido a la retrospectiva!",
        voted: "👍 ¡Voto registrado!",
        concluded: "🏁 ¡Retrospectiva finalizada!"
    }
};
