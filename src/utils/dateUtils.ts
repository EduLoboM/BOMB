export const dateUtils = {
    getLocalDateString(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    },

    getLocalDayBoundaries(dateStr: string) {
        const [year, month, day] = dateStr.split("-").map(Number) as [number, number, number];
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
            const year = parseInt(parts[0]!, 10);
            const month = parseInt(parts[1]!, 10) - 1;
            const day = parseInt(parts[2]!, 10);
            return new Date(year, month, day);
        }

        return new Date(startInput);
    },

    getDateTimeInTimezone(date: Date, timezone: string) {
        // Format to "HH:MM" in the given timezone (24h clock, force 2 digits)
        const timeOptions = { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" } as const;
        const timeFormatter = new Intl.DateTimeFormat("en-US", timeOptions);
        const timeStr = timeFormatter.format(date);

        // Format weekday (short) in the given timezone
        const dayOptions = { timeZone: timezone, weekday: "short" } as const;
        const dayFormatter = new Intl.DateTimeFormat("en-US", dayOptions);
        const dayStr = dayFormatter.format(date).toLowerCase();

        // Format date string as YYYY-MM-DD in the given timezone
        const dateOptions = { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" } as const;
        const dateFormatter = new Intl.DateTimeFormat("en-US", dateOptions);
        const parts = dateFormatter.formatToParts(date);
        const year = parts.find(p => p.type === "year")?.value;
        const month = parts.find(p => p.type === "month")?.value;
        const day = parts.find(p => p.type === "day")?.value;
        const dateStr = `${year}-${month}-${day}`;

        return {
            time: timeStr,
            weekday: dayStr,
            dateString: dateStr
        };
    },

    parsePeriodToMinutes(periodInput: string): number | null {
        const input = periodInput.trim().toLowerCase().replace(/\s+/g, "");
        const minutesMatch = input.match(/^(\d+)m$/);
        const hoursMatch = input.match(/^(\d+)h$/);
        const hoursMinutesMatch = input.match(/^(\d+)h(\d+)m$/);
        const numberOnlyMatch = input.match(/^(\d+)$/);

        if (minutesMatch) {
            return parseInt(minutesMatch[1]!, 10);
        } else if (hoursMatch) {
            return parseInt(hoursMatch[1]!, 10) * 60;
        } else if (hoursMinutesMatch) {
            return parseInt(hoursMinutesMatch[1]!, 10) * 60 + parseInt(hoursMinutesMatch[2]!, 10);
        } else if (numberOnlyMatch) {
            return parseInt(numberOnlyMatch[1]!, 10);
        }
        return null;
    },

    addDaysToDateString(dateStr: string, days: number): string {
        const [year, month, day] = dateStr.split("-").map(Number) as [number, number, number];
        // Create a UTC Date at midnight
        const date = new Date(Date.UTC(year, month - 1, day));
        date.setUTCDate(date.getUTCDate() + days);
        
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, "0");
        const d = String(date.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
};
