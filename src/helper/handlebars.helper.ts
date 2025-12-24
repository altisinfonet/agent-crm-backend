import * as Handlebars from 'handlebars';
import moment from 'moment';

export function registerHandlebarsHelpers() {
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    Handlebars.registerHelper('toLowerCase', (value: string) =>
        typeof value === 'string' ? value.toLowerCase() : value,
    );

    Handlebars.registerHelper('capitalize', (value: string) =>
        typeof value === 'string'
            ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
            : value,
    );

    Handlebars.registerHelper('formatDate', (date: Date | string, format: string) =>
        moment(date).format(format),
    );
}
