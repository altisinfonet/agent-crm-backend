import { convertUTCToTimezone } from "../utils/timezone.util";

export function transformDates<T>(
    data: T,
    timezone: string,
    fields: (keyof T)[]
): T {
    const result = { ...data };

    fields.forEach((field) => {
        if (result[field] instanceof Date) {
            result[field] = convertUTCToTimezone(
                result[field] as unknown as Date,
                timezone
            ) as any;
        }
    });

    return result;
}
