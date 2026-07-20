export const dateUtils = {
    getLocalDateString(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    },

    getLocalDayBoundaries(dateStr: string) {
        const [year, month, day] = dateStr.split("-").map(Number);
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    },

    parseStartDate(startInput: string): Date {
        if (startInput === "today") {
            return new Date();
        }

        const parts = startInput.split("-");
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }

        return new Date(startInput);
    }
};
