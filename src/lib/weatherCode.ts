import type { WeatherCondition } from '../types/weather';

const UNKNOWN: WeatherCondition = { labelKey: 'unknown', group: 'unknown' };

const CLEAR_SKY: WeatherCondition = { labelKey: 'clearSky', group: 'sun' };
const MAINLY_CLEAR: WeatherCondition = { labelKey: 'mainlyClear', group: 'sun' };
const PARTLY_CLOUDY: WeatherCondition = { labelKey: 'partlyCloudy', group: 'partly-cloudy' };
const OVERCAST: WeatherCondition = { labelKey: 'overcast', group: 'cloud' };
const FOG: WeatherCondition = { labelKey: 'fog', group: 'fog' };
const DRIZZLE: WeatherCondition = { labelKey: 'drizzle', group: 'rain' };
const FREEZING_DRIZZLE: WeatherCondition = { labelKey: 'freezingDrizzle', group: 'rain' };
const RAIN: WeatherCondition = { labelKey: 'rain', group: 'rain' };
const FREEZING_RAIN: WeatherCondition = { labelKey: 'freezingRain', group: 'rain' };
const SNOW: WeatherCondition = { labelKey: 'snow', group: 'snow' };
const SNOW_GRAINS: WeatherCondition = { labelKey: 'snowGrains', group: 'snow' };
const RAIN_SHOWERS: WeatherCondition = { labelKey: 'rainShowers', group: 'rain' };
const SNOW_SHOWERS: WeatherCondition = { labelKey: 'snowShowers', group: 'snow' };
const THUNDERSTORM: WeatherCondition = { labelKey: 'thunderstorm', group: 'thunderstorm' };
const THUNDERSTORM_HAIL: WeatherCondition = {
  labelKey: 'thunderstormHail',
  group: 'thunderstorm',
};

// Tabela WMO da spec (AC-10.3) e do plano (4.4).
const CONDITIONS: Readonly<Record<number, WeatherCondition>> = Object.freeze({
  0: CLEAR_SKY,
  1: MAINLY_CLEAR,
  2: PARTLY_CLOUDY,
  3: OVERCAST,
  45: FOG,
  48: FOG,
  51: DRIZZLE,
  53: DRIZZLE,
  55: DRIZZLE,
  56: FREEZING_DRIZZLE,
  57: FREEZING_DRIZZLE,
  61: RAIN,
  63: RAIN,
  65: RAIN,
  66: FREEZING_RAIN,
  67: FREEZING_RAIN,
  71: SNOW,
  73: SNOW,
  75: SNOW,
  77: SNOW_GRAINS,
  80: RAIN_SHOWERS,
  81: RAIN_SHOWERS,
  82: RAIN_SHOWERS,
  85: SNOW_SHOWERS,
  86: SNOW_SHOWERS,
  95: THUNDERSTORM,
  96: THUNDERSTORM_HAIL,
  99: THUNDERSTORM_HAIL,
});

// Código null ou fora da tabela vira "Condição indisponível" (AC-03.5, AC-10.2).
export function describeWeatherCode(code: number | null): WeatherCondition {
  if (code === null || !Object.hasOwn(CONDITIONS, code)) return UNKNOWN;
  return CONDITIONS[code];
}
