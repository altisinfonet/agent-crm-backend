import { Prisma } from '@generated/prisma';

export type CountryBulkItem = {
  name: string;
  region?: string | null;
  timezones: Record<string, string>;
  iso?: {
    'alpha-2'?: string | null;
  };
  phone?: string[] | null;
  emoji?: string | null;
  image?: string | null;
  phoneLength?: number | number[] | null;
};

export type CountryInsertPayload = Prisma.CountryCreateManyInput;

export function parseCountryTimezone(timezones: Record<string, string>) {
  const [timezone = 'UTC', offset = '+00:00'] =
    Object.entries(timezones ?? {})[0] ?? [];

  const sign = offset.startsWith('-') ? -1 : 1;
  const [hours = '0', minutes = '0'] =
    offset.replace('+', '').replace('-', '').split(':');

  return {
    timezone,
    utc_offset_min: sign * (Number(hours) * 60 + Number(minutes)),
  };
}

export function mapCountryPayload(
  item: CountryBulkItem,
): CountryInsertPayload | null {
  const { timezone, utc_offset_min } = parseCountryTimezone(item.timezones);
  const isoCode = item.iso?.['alpha-2'];
  const phoneLength = Array.isArray(item.phoneLength)
    ? item.phoneLength[0]
    : item.phoneLength;

  if (!isoCode || phoneLength == null) {
    return null;
  }

  return {
    name: item.name,
    iso_code: isoCode,
    phone_code: item.phone?.[0] ?? null,
    region: item.region ?? null,
    phoneLength,
    timezone,
    utc_offset_min,
    image: item.image ?? item.emoji ?? null,
  };
}

export function mapCountryPayloads(
  payload: CountryBulkItem[],
): CountryInsertPayload[] {
  const uniqueMap = new Map<string, CountryInsertPayload>();

  for (const item of payload) {
    const mappedCountry = mapCountryPayload(item);

    if (!mappedCountry) {
      continue;
    }

    uniqueMap.set(mappedCountry.iso_code, mappedCountry);
  }

  return [...uniqueMap.values()];
}