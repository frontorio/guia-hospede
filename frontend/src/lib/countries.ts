import type { CountryCode } from 'libphonenumber-js';

export interface Country {
  iso: CountryCode;
  name: string;
  dial: string; // código DDI sem o "+"
}

/** Converte ISO (ex.: "BR") no emoji de bandeira correspondente. */
export function isoToFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/** Lista curada de países (Brasil primeiro). */
export const COUNTRIES: Country[] = [
  { iso: 'BR', name: 'Brasil', dial: '55' },
  { iso: 'PT', name: 'Portugal', dial: '351' },
  { iso: 'US', name: 'Estados Unidos', dial: '1' },
  { iso: 'AR', name: 'Argentina', dial: '54' },
  { iso: 'UY', name: 'Uruguai', dial: '598' },
  { iso: 'CL', name: 'Chile', dial: '56' },
  { iso: 'PY', name: 'Paraguai', dial: '595' },
  { iso: 'MX', name: 'México', dial: '52' },
  { iso: 'ES', name: 'Espanha', dial: '34' },
  { iso: 'FR', name: 'França', dial: '33' },
  { iso: 'IT', name: 'Itália', dial: '39' },
  { iso: 'DE', name: 'Alemanha', dial: '49' },
  { iso: 'GB', name: 'Reino Unido', dial: '44' },
  { iso: 'CA', name: 'Canadá', dial: '1' },
  { iso: 'JP', name: 'Japão', dial: '81' },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0];

export function countryByIso(iso?: string | null): Country | undefined {
  return COUNTRIES.find((c) => c.iso === iso);
}
