import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { isoToFlag } from './countries';

export interface PhoneDisplay {
  flag: string;
  /** Número formatado internacional, ex.: "+55 48 99123-4567". */
  text: string;
  /** Link do WhatsApp, ex.: "https://wa.me/554899123...". */
  whatsapp: string;
}

/** Formata um telefone (E.164) para exibição, com bandeira e link de WhatsApp. */
export function formatPhoneDisplay(phone?: string | null): PhoneDisplay | null {
  if (!phone) return null;
  const pn = parsePhoneNumberFromString(phone);
  if (pn) {
    return {
      flag: pn.country ? isoToFlag(pn.country) : '🌐',
      text: pn.formatInternational(),
      whatsapp: `https://wa.me/${pn.number.replace('+', '')}`,
    };
  }
  // Número não reconhecido: usa apenas os dígitos.
  const digits = phone.replace(/\D/g, '');
  return { flag: '🌐', text: phone, whatsapp: `https://wa.me/${digits}` };
}
