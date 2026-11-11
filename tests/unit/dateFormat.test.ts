import { describe, expect, it } from 'vitest';
import { formatDate, formatTime } from '../../src/lib/dateFormat';

describe('formatTime', () => {
  it('extrai HH:mm da hora local da API sem criar Date (R-11)', () => {
    expect(formatTime('2026-11-11T15:00')).toBe('15:00');
    expect(formatTime('2026-11-11T00:05')).toBe('00:05');
  });

  it('exibe "—" quando o valor não tem o formato esperado', () => {
    expect(formatTime('')).toBe('—');
    expect(formatTime('15:00')).toBe('—');
    expect(formatTime('2026-11-11')).toBe('—');
  });
});

describe('formatDate', () => {
  it('converte YYYY-MM-DD em dd/mm/aaaa (RN-08)', () => {
    expect(formatDate('2026-11-11')).toBe('11/11/2026');
    expect(formatDate('2026-01-05')).toBe('05/01/2026');
  });

  it('exibe "—" quando o valor não é uma data ISO', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate('11/11/2026')).toBe('—');
  });
});
