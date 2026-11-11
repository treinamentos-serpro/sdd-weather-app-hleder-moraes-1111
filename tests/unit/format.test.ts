import { describe, expect, it } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';

// 2026-11-11 é quarta-feira; 2026-11-15 é domingo.
describe('getDayLabel', () => {
  it('retorna "Hoje" para o índice 0', () => {
    expect(getDayLabel('2026-11-11', 0)).toBe('Hoje');
  });

  it('retorna "Amanhã" para o índice 1', () => {
    expect(getDayLabel('2026-11-12', 1)).toBe('Amanhã');
  });

  it.each([
    ['2026-11-15', 'Dom'],
    ['2026-11-16', 'Seg'],
    ['2026-11-17', 'Ter'],
    ['2026-11-18', 'Qua'],
    ['2026-11-19', 'Qui'],
    ['2026-11-20', 'Sex'],
    ['2026-11-21', 'Sáb'],
  ])('retorna o dia da semana abreviado para %s', (iso, label) => {
    expect(getDayLabel(iso, 2)).toBe(label);
  });

  it('usa o dia da semana a partir do índice 2, independentemente do índice', () => {
    expect(getDayLabel('2026-11-13', 4)).toBe('Sex');
  });
});

describe('getShortDate', () => {
  it.each([
    ['2026-11-11', '11 Nov'],
    ['2026-06-12', '12 Jun'],
    ['2026-01-05', '5 Jan'],
    ['2026-02-01', '1 Fev'],
    ['2026-12-31', '31 Dez'],
  ])('formata %s como "%s"', (iso, expected) => {
    expect(getShortDate(iso)).toBe(expected);
  });
});
