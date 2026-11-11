import { ptBR } from '../text/pt-BR';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  WeatherData,
  WeatherErrorKind,
} from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 5;
const REQUEST_TIMEOUT_MS = 10_000;

/** Erro da camada de dados. O `kind` define a mensagem exibida e se cabe nova tentativa. */
export class WeatherServiceError extends Error {
  readonly kind: WeatherErrorKind;

  constructor(kind: WeatherErrorKind) {
    super(ptBR.states.error[kind]);
    this.kind = kind;
    this.name = 'WeatherServiceError';
  }
}

/**
 * GET + leitura do JSON dentro do mesmo prazo de 10 s, para que um corpo que
 * nunca termina também seja abortado. `badRequestKind` define o significado de HTTP 400
 * em cada endpoint.
 */
async function fetchJson(url: string, badRequestKind: WeatherErrorKind): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new WeatherServiceError(kindForStatus(res.status, badRequestKind));
    return await res.json();
  } catch (err) {
    if (err instanceof WeatherServiceError) throw err;
    if (hasName(err, 'AbortError')) throw new WeatherServiceError('timeout');
    // JSON malformado. Falhas de rede e de corpo interrompido chegam como TypeError.
    if (hasName(err, 'SyntaxError')) throw new WeatherServiceError('invalid_response');
    throw new WeatherServiceError('network');
  } finally {
    clearTimeout(timeout);
  }
}

function kindForStatus(status: number, badRequestKind: WeatherErrorKind): WeatherErrorKind {
  if (status === 429) return 'rate_limit';
  if (status === 400) return badRequestKind;
  return 'server';
}

function hasName(err: unknown, name: string): boolean {
  return typeof err === 'object' && err !== null && 'name' in err && err.name === name;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
}

export async function searchCities(name: string): Promise<City[]> {
  const term = name.trim();
  if (!term) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(term)}&count=10&language=pt&format=json`;
  const data = await fetchJson(url, 'server');
  if (!isRecord(data)) throw new WeatherServiceError('invalid_response');

  // A API omite a chave `results` quando não há resposta para o termo.
  const results: unknown[] = Array.isArray(data.results) ? data.results : [];
  // Sem id, nome ou coordenadas válidos a cidade não pode ser exibida nem consultada.
  return results.filter(isValidGeocodingResult).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: stringOrEmpty(r.country),
    countryCode: stringOrEmpty(r.country_code),
    admin1: stringOrNull(r.admin1),
  }));
}

function isValidGeocodingResult(r: unknown): r is GeocodingResult {
  return (
    isRecord(r) &&
    Number.isInteger(r.id) &&
    typeof r.name === 'string' &&
    r.name.trim() !== '' &&
    finiteOrNull(r.latitude) !== null &&
    finiteOrNull(r.longitude) !== null
  );
}

interface ForecastResponse {
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: unknown;
    apparent_temperature?: unknown;
    relative_humidity_2m?: unknown;
    wind_speed_10m?: unknown;
    precipitation?: unknown;
    pressure_msl?: unknown;
    weather_code?: unknown;
    is_day?: unknown;
  };
  daily?: {
    time?: string[];
    weather_code?: unknown[];
    temperature_2m_max?: unknown[];
    temperature_2m_min?: unknown[];
  };
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function stringOrEmpty(value: unknown): string {
  return stringOrNull(value) ?? '';
}

function mapCurrent(c: NonNullable<ForecastResponse['current']>): CurrentWeather {
  return {
    time: stringOrEmpty(c.time),
    temperature: finiteOrNull(c.temperature_2m),
    apparentTemperature: finiteOrNull(c.apparent_temperature),
    weatherCode: finiteOrNull(c.weather_code),
    isDay: c.is_day !== 0,
    humidity: finiteOrNull(c.relative_humidity_2m),
    windSpeed: finiteOrNull(c.wind_speed_10m),
    precipitation: finiteOrNull(c.precipitation),
    pressure: finiteOrNull(c.pressure_msl),
  };
}

// Arrays paralelos: o índice i de cada campo pertence ao mesmo dia.
// Um dia sem data válida é descartado, pois não há rótulo nem data para exibir.
function mapDaily(d: NonNullable<ForecastResponse['daily']>): ForecastDay[] {
  const times = Array.isArray(d.time) ? d.time : [];
  return times.slice(0, FORECAST_DAYS).flatMap((date, i) => {
    const isoDate = stringOrNull(date);
    if (isoDate === null) return [];
    return [
      {
        date: isoDate,
        temperatureMax: finiteOrNull(d.temperature_2m_max?.[i]),
        temperatureMin: finiteOrNull(d.temperature_2m_min?.[i]),
        weatherCode: finiteOrNull(d.weather_code?.[i]),
      },
    ];
  });
}

export async function getWeather(city: City): Promise<WeatherData> {
  const url =
    `${FORECAST_URL}?latitude=${city.latitude}&longitude=${city.longitude}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,pressure_msl,weather_code,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
    `&forecast_days=${FORECAST_DAYS}&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;

  const data = await fetchJson(url, 'no_data');
  if (!isRecord(data)) throw new WeatherServiceError('invalid_response');

  const forecast = data as ForecastResponse;
  if (!forecast.current || !forecast.daily) throw new WeatherServiceError('no_data');

  return {
    city,
    timezone: stringOrEmpty(forecast.timezone),
    current: mapCurrent(forecast.current),
    daily: mapDaily(forecast.daily),
  };
}
