import { describe, expect, it } from 'vitest';
import { describeWeatherCode } from '../../src/lib/weatherCode';
import type { WeatherCondition } from '../../src/types/weather';

const UNKNOWN: WeatherCondition = { labelKey: 'unknown', group: 'unknown' };

describe('describeWeatherCode', () => {
  it.each<[number, WeatherCondition]>([
    [0, { labelKey: 'clearSky', group: 'sun' }],
    [1, { labelKey: 'mainlyClear', group: 'sun' }],
    [2, { labelKey: 'partlyCloudy', group: 'partly-cloudy' }],
    [3, { labelKey: 'overcast', group: 'cloud' }],
    [45, { labelKey: 'fog', group: 'fog' }],
    [48, { labelKey: 'fog', group: 'fog' }],
    [51, { labelKey: 'drizzle', group: 'rain' }],
    [53, { labelKey: 'drizzle', group: 'rain' }],
    [55, { labelKey: 'drizzle', group: 'rain' }],
    [56, { labelKey: 'freezingDrizzle', group: 'rain' }],
    [57, { labelKey: 'freezingDrizzle', group: 'rain' }],
    [61, { labelKey: 'rain', group: 'rain' }],
    [63, { labelKey: 'rain', group: 'rain' }],
    [65, { labelKey: 'rain', group: 'rain' }],
    [66, { labelKey: 'freezingRain', group: 'rain' }],
    [67, { labelKey: 'freezingRain', group: 'rain' }],
    [71, { labelKey: 'snow', group: 'snow' }],
    [73, { labelKey: 'snow', group: 'snow' }],
    [75, { labelKey: 'snow', group: 'snow' }],
    [77, { labelKey: 'snowGrains', group: 'snow' }],
    [80, { labelKey: 'rainShowers', group: 'rain' }],
    [81, { labelKey: 'rainShowers', group: 'rain' }],
    [82, { labelKey: 'rainShowers', group: 'rain' }],
    [85, { labelKey: 'snowShowers', group: 'snow' }],
    [86, { labelKey: 'snowShowers', group: 'snow' }],
    [95, { labelKey: 'thunderstorm', group: 'thunderstorm' }],
    [96, { labelKey: 'thunderstormHail', group: 'thunderstorm' }],
    [99, { labelKey: 'thunderstormHail', group: 'thunderstorm' }],
  ])('código WMO %i mapeia para %j', (code, expected) => {
    expect(describeWeatherCode(code)).toEqual(expected);
  });

  it.each([
    4, 10, 44, 58, 70, 100, -1, 1.5,
  ])('código %s fora da tabela cai em "Condição indisponível"', (code) => {
    expect(describeWeatherCode(code)).toEqual(UNKNOWN);
  });

  it('retorna "Condição indisponível" quando o código é null', () => {
    expect(describeWeatherCode(null)).toEqual(UNKNOWN);
  });
});
