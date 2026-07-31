export const dateUtils = {
    getLocalDateString(date: Date = new Date()): string {
        const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    },

    getLocalDayBoundaries(dateStr: string) {
        const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
        return {
            start: new Date(y, m - 1, d, 0, 0, 0, 0).toISOString(),
            end: new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
        };
    },

    parseStartDate(startInput: string): Date {
        if (startInput === "today") return new Date();
        const parts = startInput.split("-");
        return parts.length === 3 ? new Date(+parts[0]!, +parts[1]! - 1, +parts[2]!) : new Date(startInput);
    },

    getDateTimeInTimezone(date: Date, timezone: string) {
        const time = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
        const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(date).toLowerCase();
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
        const getPart = (t: string) => parts.find(p => p.type === t)?.value;
        return { time, weekday, dateString: `${getPart("year")}-${getPart("month")}-${getPart("day")}` };
    },

    parsePeriodToMinutes(periodInput: string): number | null {
        const input = periodInput.trim().toLowerCase().replace(/\s+/g, "");
        const m = input.match(/^(\d+)m$/) || input.match(/^(\d+)$/);
        if (m) return parseInt(m[1]!, 10);
        const h = input.match(/^(\d+)h$/);
        if (h) return parseInt(h[1]!, 10) * 60;
        const hm = input.match(/^(\d+)h(\d+)m$/);
        return hm ? parseInt(hm[1]!, 10) * 60 + parseInt(hm[2]!, 10) : null;
    },

    addDaysToDateString(dateStr: string, days: number): string {
        const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
        const date = new Date(Date.UTC(y, m - 1, d));
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().split("T")[0]!;
    },

    normalizeTimezone(input: string): string {
        if (!input) return "UTC";
        const str = input.trim();
        const m1 = str.match(/^([+-]?)(\d{1,2})$/);
        if (m1) return `${m1[1] === "-" ? "-" : "+"}${m1[2]!.padStart(2, "0")}:00`;
        const m2 = str.match(/^([+-]?)(\d{1,2}):(\d{2})$/);
        return m2 ? `${m2[1] === "-" ? "-" : "+"}${m2[2]!.padStart(2, "0")}:${m2[3]}` : str;
    },

    isWeekdayMatching(weekdaysInput: string | null | undefined, date: Date = new Date(), timezone: string = "UTC"): boolean {
        if (!weekdaysInput) return true;
        const dayStr = this.getDateTimeInTimezone(date, timezone).weekday;
        const dayToNum: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
        const dayToPt: Record<string, string> = { mon: "seg", tue: "ter", wed: "qua", thu: "qui", fri: "sex", sat: "sab", sun: "dom" };
        const currentNum = dayToNum[dayStr] ?? 1, currentPt = dayToPt[dayStr] ?? "seg";
        return weekdaysInput.split(",").map(s => s.trim().toLowerCase()).some(token => {
            if (token === dayStr || token === currentPt) return true;
            const parsedNum = parseInt(token, 10);
            return !isNaN(parsedNum) && (parsedNum === currentNum || (parsedNum === 0 && currentNum === 7));
        });
    }
};

