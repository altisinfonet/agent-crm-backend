import { format, toZonedTime } from "date-fns-tz";

export function convertUTCToTimezone(
    date: Date | null,
    timezone: string,
    formatStr = "yyyy-MM-dd HH:mm:ss"
): string | null {
    if (!date) return null;

    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, formatStr, { timeZone: timezone });
}
