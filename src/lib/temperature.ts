import type { Unit } from '../types/weather';

const UNIT_SYMBOL: Readonly<Record<Unit, string>> = {
  celsius: '°C',
  fahrenheit: '°F',
};

// Sem arredondamento: a conversão acontece sobre o valor bruto da API (RN-02).
export function toUnit(celsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
}

// RN-05: empate vai para o maior valor (2,5 → 3; −2,5 → −2).
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

// Qualquer valor que não seja número finito vira "—", mesmo se chegar sem passar pelo serviço.
export function formatTemperature(celsius: number | null, unit: Unit): string {
  if (celsius === null || !Number.isFinite(celsius)) return '—';
  return `${roundHalfUp(toUnit(celsius, unit))} ${UNIT_SYMBOL[unit]}`;
}
