import { useEffect, useRef, useState } from 'react';
import {
  AsYouType,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from 'libphonenumber-js';
import { COUNTRIES, DEFAULT_COUNTRY, isoToFlag } from '../lib/countries';

interface Props {
  value?: string | null;
  onChange: (e164: string) => void;
}

function dialOf(iso: CountryCode): string {
  return COUNTRIES.find((c) => c.iso === iso)?.dial ?? '';
}

/** Reconstrói o E.164 a partir do país + dígitos nacionais. */
function buildE164(iso: CountryCode, national: string): string {
  const digits = national.replace(/\D/g, '');
  return digits ? `+${dialOf(iso)}${digits}` : '';
}

/**
 * Limita os dígitos ao máximo válido do país selecionado (usa o metadata da
 * libphonenumber-js). Assim o BR respeita o tamanho de um número BR, o US o
 * do US, etc. — sem número mágico.
 */
function capDigits(digits: string, iso: CountryCode): string {
  let d = digits;
  while (d.length > 1 && validatePhoneNumberLength(d, iso) === 'TOO_LONG') {
    d = d.slice(0, -1);
  }
  return d;
}

/** Deriva país + número nacional formatado a partir de um E.164. */
function derive(value?: string | null): { iso: CountryCode; national: string } {
  if (value) {
    const pn = parsePhoneNumberFromString(value);
    if (pn?.country) return { iso: pn.country, national: pn.formatNational() };
  }
  return { iso: DEFAULT_COUNTRY.iso, national: '' };
}

/**
 * Campo de telefone com seletor de DDI (bandeira + código). Formata o número
 * conforme o país selecionado (AsYouType) e emite o valor em E.164.
 */
export function PhoneInput({ value, onChange }: Props) {
  const init = useRef(derive(value)).current;
  const [iso, setIso] = useState<CountryCode>(init.iso);
  const [national, setNational] = useState<string>(init.national);

  // Ressincroniza se o valor externo mudar (ex.: reset do formulário na edição).
  useEffect(() => {
    if ((value ?? '') !== buildE164(iso, national)) {
      const d = derive(value);
      setIso(d.iso);
      setNational(d.national);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleCountry(newIso: CountryCode) {
    setIso(newIso);
    onChange(buildE164(newIso, national));
  }

  function handleNational(input: string) {
    // Limita ao tamanho máximo do país selecionado (evita quebrar a máscara).
    const digits = capDigits(input.replace(/\D/g, ''), iso);
    const formatted = new AsYouType(iso).input(digits);
    setNational(formatted);
    onChange(buildE164(iso, formatted));
  }

  return (
    <div className="flex gap-2">
      <select
        className="input w-auto shrink-0"
        value={iso}
        onChange={(e) => handleCountry(e.target.value as CountryCode)}
        aria-label="Código do país (DDI)"
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso} value={c.iso}>
            {isoToFlag(c.iso)} +{c.dial} · {c.name}
          </option>
        ))}
      </select>
      <input
        className="input"
        inputMode="tel"
        placeholder="(48) 99123-4567"
        value={national}
        onChange={(e) => handleNational(e.target.value)}
      />
    </div>
  );
}
