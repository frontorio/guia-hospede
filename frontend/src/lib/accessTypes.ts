import type { PropertyAccessType } from '../api/types';

/** Opções de tipo de acesso (valor do enum → rótulo exibido). */
export const ACCESS_TYPES: { value: PropertyAccessType; label: string }[] = [
  { value: 'key_safe', label: 'Cofre de chaves' },
  { value: 'smart_lock', label: 'Smart lock' },
  { value: 'bluetooth_app', label: 'Bluetooth/App' },
  { value: 'tag', label: 'Tag' },
];

const LABELS: Record<PropertyAccessType, string> = ACCESS_TYPES.reduce(
  (acc, { value, label }) => ({ ...acc, [value]: label }),
  {} as Record<PropertyAccessType, string>,
);

/** Rótulo amigável para um valor de tipo de acesso. */
export function accessTypeLabel(value?: string | null): string {
  if (!value) return '';
  return LABELS[value as PropertyAccessType] ?? value;
}
