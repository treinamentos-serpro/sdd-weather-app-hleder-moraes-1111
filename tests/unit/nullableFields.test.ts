import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';
import { formatTemperature } from '../../src/lib/temperature';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const city: City = {
  id: 3462,
  name: 'Curitiba',
  latitude: -25.4284,
  longitude: -49.2733,
  country: 'Brasil',
  countryCode: 'BR',
  admin1: 'Paraná',
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('formatação com valores inválidos (sem NaN/undefined na UI)', () => {
  it('formatTemperature mostra "—" para NaN e Infinity', () => {
    expect(formatTemperature(Number.NaN, 'celsius')).toBe('—');
    expect(formatTemperature(Number.POSITIVE_INFINITY, 'fahrenheit')).toBe('—');
  });

  it('getDayLabel e getShortDate mostram "—" para data inválida ou vazia', () => {
    expect(getDayLabel('', 2)).toBe('—');
    expect(getDayLabel('nao-e-data', 3)).toBe('—');
    expect(getShortDate('')).toBe('—');
  });
});

describe('searchCities com campos ausentes', () => {
  it('descarta resultados sem nome, sem id inteiro ou com coordenadas inválidas', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        results: [
          { id: 1, name: 'Sem coordenadas', latitude: null, longitude: -49 },
          { id: 2, latitude: -25, longitude: -49 },
          { id: 3.5, name: 'Id quebrado', latitude: -25, longitude: -49 },
          { id: 4, name: '   ', latitude: -25, longitude: -49 },
          { id: 5, name: 'Válida', latitude: -25, longitude: -49 },
        ],
      }),
    );

    const cities = await searchCities('x');

    expect(cities.map((c) => c.name)).toEqual(['Válida']);
  });

  it('usa null em admin1 e vazio em país quando ausentes', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ results: [{ id: 9, name: 'Lugar', latitude: 1, longitude: 2 }] }),
    );

    const [result] = await searchCities('Lugar');

    expect(result.admin1).toBeNull();
    expect(result.country).toBe('');
    expect(result.countryCode).toBe('');
  });
});

describe('getWeather com campos ausentes', () => {
  it('mantém null para métricas ausentes e vazio para hora e fuso', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        current: { temperature_2m: null, weather_code: 'x' },
        daily: { time: ['2026-11-11'] },
      }),
    );

    const data = await getWeather(city);

    expect(data.timezone).toBe('');
    expect(data.current.time).toBe('');
    expect(data.current.temperature).toBeNull();
    expect(data.current.weatherCode).toBeNull();
    expect(data.current.humidity).toBeNull();
    expect(data.daily[0]).toEqual({
      date: '2026-11-11',
      temperatureMax: null,
      temperatureMin: null,
      weatherCode: null,
    });
  });

  it('descarta dia sem data sem deslocar os valores dos dias seguintes', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        current: { time: '2026-11-11T15:00' },
        daily: {
          time: ['2026-11-11', null, '2026-11-13'],
          temperature_2m_max: [20, 99, 22],
          temperature_2m_min: [10, 99, 12],
          weather_code: [1, 99, 3],
        },
      }),
    );

    const data = await getWeather(city);

    expect(data.daily.map((d) => d.date)).toEqual(['2026-11-11', '2026-11-13']);
    expect(data.daily[1]).toMatchObject({ temperatureMax: 22, temperatureMin: 12, weatherCode: 3 });
  });
});
