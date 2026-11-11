import { describe, expect, it } from 'vitest';
import { formatTemperature, roundHalfUp, toUnit } from '../../src/lib/temperature';

describe('toUnit', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [37, 98.6],
  ])('converte %s °C para %s °F sem arredondar', (celsius, fahrenheit) => {
    expect(toUnit(celsius, 'fahrenheit')).toBeCloseTo(fahrenheit, 10);
  });

  it('mantém o valor em Celsius quando a unidade é celsius', () => {
    expect(toUnit(21.4, 'celsius')).toBe(21.4);
  });
});

describe('roundHalfUp (RN-05)', () => {
  it.each([
    [2.5, 3],
    [-2.5, -2],
    [2.4, 2],
    [2.6, 3],
    [-2.6, -3],
    [0, 0],
  ])('arredonda %s para %s', (value, expected) => {
    expect(roundHalfUp(value)).toBe(expected);
  });
});

describe('formatTemperature', () => {
  it.each([
    [0, 'celsius', '0 °C'],
    [0, 'fahrenheit', '32 °F'],
    [100, 'fahrenheit', '212 °F'],
    [-40, 'celsius', '-40 °C'],
    [-40, 'fahrenheit', '-40 °F'],
    [37, 'fahrenheit', '99 °F'],
  ] as const)('formata %s em %s como "%s"', (celsius, unit, expected) => {
    expect(formatTemperature(celsius, unit)).toBe(expected);
  });

  it('converte o valor bruto da API, não o valor já arredondado (AC-05.1)', () => {
    // 24,6 °C → 76,28 °F → 76 °F. Arredondar antes (25 °C → 77 °F) daria resultado errado.
    expect(formatTemperature(24.6, 'fahrenheit')).toBe('76 °F');
    expect(formatTemperature(21.4, 'fahrenheit')).toBe('71 °F');
    expect(formatTemperature(19.8, 'fahrenheit')).toBe('68 °F');
    expect(formatTemperature(15.2, 'fahrenheit')).toBe('59 °F');
  });

  it('arredonda os valores de Celsius exibidos (AC-05.1)', () => {
    expect(formatTemperature(21.4, 'celsius')).toBe('21 °C');
    expect(formatTemperature(19.8, 'celsius')).toBe('20 °C');
    expect(formatTemperature(24.6, 'celsius')).toBe('25 °C');
    expect(formatTemperature(15.2, 'celsius')).toBe('15 °C');
  });

  it('exibe "—" quando o valor é null', () => {
    expect(formatTemperature(null, 'celsius')).toBe('—');
    expect(formatTemperature(null, 'fahrenheit')).toBe('—');
  });
});
