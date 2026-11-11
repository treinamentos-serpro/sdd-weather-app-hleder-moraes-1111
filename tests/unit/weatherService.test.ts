import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import { ptBR } from '../../src/text/pt-BR';
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

const validForecast = {
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-11-11T15:00',
    temperature_2m: 21.4,
    apparent_temperature: 19.8,
    relative_humidity_2m: 78,
    wind_speed_10m: 12.4,
    precipitation: 0.4,
    pressure_msl: 1013.6,
    weather_code: 2,
    is_day: 1,
  },
  daily: {
    time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
    weather_code: [2, 1, 61, 95, 3],
    temperature_2m_max: [24.6, 26.1, 22.3, 19.7, 23.5],
    temperature_2m_min: [15.2, 17.0, 15.4, 13.8, 14.9],
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function requestedUrl(): URL {
  return new URL(String(fetchMock.mock.calls[0][0]));
}

describe('searchCities', () => {
  it('não faz requisição quando o termo é vazio ou só espaços (E-01)', async () => {
    await expect(searchCities('')).resolves.toEqual([]);
    await expect(searchCities('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envia o termo sem espaços nas bordas e codificado (AC-01.3)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [] }));

    await searchCities('  São Paulo ');

    expect(String(fetchMock.mock.calls[0][0])).toContain('name=S%C3%A3o%20Paulo');
  });

  it.each([
    '@#$%',
    '?&=',
  ])('trata "%s" como texto, sem alterar os parâmetros da query (AC-01.6)', async (term) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    await searchCities(term);

    expect(requestedUrl().searchParams.get('name')).toBe(term);
    expect(requestedUrl().searchParams.has('count')).toBe(true);
  });

  it('retorna lista vazia quando a API omite results (E-03)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ generationtime_ms: 0.4 }));

    await expect(searchCities('xyzabc')).resolves.toEqual([]);
  });

  it('mapeia país e região ausentes para valores vazios/null', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ results: [{ id: 1, name: 'Ilha', latitude: 1, longitude: 2 }] }),
    );

    await expect(searchCities('Ilha')).resolves.toEqual([
      {
        id: 1,
        name: 'Ilha',
        latitude: 1,
        longitude: 2,
        country: '',
        countryCode: '',
        admin1: null,
      },
    ]);
  });

  it('lança WeatherServiceError quando o geocoding responde HTTP 500 (E-10)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: true }, 500));

    await expect(searchCities('Curitiba')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('lança WeatherServiceError em falha de rede (E-08)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(searchCities('Curitiba')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('lança WeatherServiceError quando a requisição excede 10 s (E-24)', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );

    const pending = searchCities('Curitiba');
    const assertion = expect(pending).rejects.toBeInstanceOf(WeatherServiceError);
    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
  });

  it('descarta resultados sem latitude ou longitude e mantém os demais (AC-01.5, E-28)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        results: [
          { id: 1, name: 'Sem latitude', longitude: 2 },
          { id: 2, name: 'Válida', latitude: 1, longitude: 2 },
          { id: 3, name: 'Latitude texto', latitude: '1', longitude: 2 },
        ],
      }),
    );

    const cities = await searchCities('Qualquer');

    expect(cities.map((c) => c.name)).toEqual(['Válida']);
  });
});

describe('getWeather', () => {
  it('pede Celsius, km/h, 5 dias e fuso automático à API (RN-02, E-15)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(validForecast));

    await getWeather(city);

    const url = requestedUrl();
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('forecast_days')).toBe('5');
    expect(url.searchParams.get('timezone')).toBe('auto');
  });

  it('mapeia uma resposta completa com valores brutos da API', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(validForecast));

    const data = await getWeather(city);

    expect(data.city).toBe(city);
    expect(data.timezone).toBe('America/Sao_Paulo');
    expect(data.current).toEqual({
      time: '2026-11-11T15:00',
      temperature: 21.4,
      apparentTemperature: 19.8,
      weatherCode: 2,
      isDay: true,
      humidity: 78,
      windSpeed: 12.4,
      precipitation: 0.4,
      pressure: 1013.6,
    });
    expect(data.daily).toHaveLength(5);
    expect(data.daily[0]).toEqual({
      date: '2026-11-11',
      temperatureMax: 24.6,
      temperatureMin: 15.2,
      weatherCode: 2,
    });
  });

  it('limita a previsão a 5 dias mesmo que a API retorne mais', async () => {
    const extended = {
      ...validForecast,
      daily: {
        time: [...validForecast.daily.time, '2026-11-16', '2026-11-17'],
        weather_code: [...validForecast.daily.weather_code, 0, 0],
        temperature_2m_max: [...validForecast.daily.temperature_2m_max, 20, 20],
        temperature_2m_min: [...validForecast.daily.temperature_2m_min, 10, 10],
      },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(extended));

    const data = await getWeather(city);

    expect(data.daily).toHaveLength(5);
  });

  it('trata campos ausentes, null e de tipo errado como null, sem lançar (AC-03.5, E-21, E-27)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        current: {
          time: '2026-11-11T15:00',
          temperature_2m: '21',
          apparent_temperature: null,
          weather_code: 999,
          is_day: 1,
        },
        daily: { time: ['2026-11-11'] },
      }),
    );

    const data = await getWeather(city);

    expect(data.current.temperature).toBeNull();
    expect(data.current.apparentTemperature).toBeNull();
    expect(data.current.humidity).toBeNull();
    expect(data.current.weatherCode).toBe(999);
    expect(data.timezone).toBe('');
  });

  it('preenche com null quando os arrays diários têm tamanhos diferentes (E-26)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        ...validForecast,
        daily: {
          time: ['2026-11-11', '2026-11-12', '2026-11-13'],
          weather_code: [2],
          temperature_2m_max: [24.6, null],
          temperature_2m_min: [15.2],
        },
      }),
    );

    const data = await getWeather(city);

    expect(data.daily).toEqual([
      { date: '2026-11-11', temperatureMax: 24.6, temperatureMin: 15.2, weatherCode: 2 },
      { date: '2026-11-12', temperatureMax: null, temperatureMin: null, weatherCode: null },
      { date: '2026-11-13', temperatureMax: null, temperatureMin: null, weatherCode: null },
    ]);
  });

  it('lança WeatherServiceError quando current está ausente (E-10)', async () => {
    const { current: _current, ...withoutCurrent } = validForecast;
    fetchMock.mockResolvedValueOnce(jsonResponse(withoutCurrent));

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('lança WeatherServiceError quando daily é null (E-10)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...validForecast, daily: null }));

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('lança WeatherServiceError em HTTP 500 (AC-07.2)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ reason: 'boom' }, 500));

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('lança erro em JSON malformado sem exibir dados parciais (E-10)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"current": ', { status: 200 }));

    await expect(getWeather(city)).rejects.toThrow();
  });

  it('lança WeatherServiceError em falha de rede (E-08)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('usa a mensagem de falha de rede de pt-BR (AC-07.2)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(getWeather(city)).rejects.toThrow(ptBR.states.error.network);
  });

  it('usa a mensagem de timeout de pt-BR após 10 s (AC-07.5)', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );

    const pending = getWeather(city);
    const assertion = expect(pending).rejects.toThrow(ptBR.states.error.timeout);
    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
  });

  it('usa a mensagem de limite de uso para HTTP 429 (AC-07.7, E-09)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ reason: 'limit' }, 429));

    await expect(getWeather(city)).rejects.toThrow(ptBR.states.error.rate_limit);
  });

  it('usa a mensagem de "sem dados" para forecast que rejeita as coordenadas (AC-07.6, E-25)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: true, reason: 'Latitude must be in range of -90 to 90' }, 400),
    );

    await expect(getWeather(city)).rejects.toThrow(ptBR.states.error.no_data);
  });

  it('usa a mensagem de "sem dados" quando current e daily estão ausentes (AC-07.4)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ timezone: 'America/Sao_Paulo' }));

    await expect(getWeather(city)).rejects.toThrow(ptBR.states.error.no_data);
  });
});
