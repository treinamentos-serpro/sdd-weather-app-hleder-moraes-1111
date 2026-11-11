import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import { ptBR } from '../../src/text/pt-BR';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const curitiba: City = mockWeatherData.city;
const lisboa: City = {
  id: 2267057,
  name: 'Lisboa',
  latitude: 38.7223,
  longitude: -9.1393,
  country: 'Portugal',
  countryCode: 'PT',
  admin1: null,
};
const lisboaWeather: WeatherData = { ...mockWeatherData, city: lisboa };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useWeather', () => {
  it('ignora termo vazio ou só espaços sem chamar a API (E-01)', async () => {
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('   ');
    });

    expect(result.current.status).toBe('idle');
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('muda para "empty" quando a busca não retorna cidades (E-03)', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('xyzabc');
    });

    expect(result.current.status).toBe('empty');
    expect(result.current.cities).toEqual([]);
    expect(result.current.data).toBeNull();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('carrega a primeira cidade e expõe a lista completa', async () => {
    vi.mocked(searchCities).mockResolvedValue([curitiba, lisboa]);
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Curitiba');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toBe(curitiba);
    expect(result.current.cities).toEqual([curitiba, lisboa]);
  });

  it('exibe mensagem de erro quando a previsão falha (AC-07.2)', async () => {
    vi.mocked(searchCities).mockResolvedValue([curitiba]);
    vi.mocked(getWeather).mockRejectedValue(new WeatherServiceError('server'));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Curitiba');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(ptBR.states.error.server);
    expect(result.current.errorKind).toBe('server');
    expect(result.current.data).toBeNull();
  });

  it('usa mensagem genérica para erros inesperados, sem expor detalhes técnicos', async () => {
    vi.mocked(searchCities).mockRejectedValue(new SyntaxError('Unexpected token'));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Curitiba');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorKind).toBe('invalid_response');
    expect(result.current.error).toBe(ptBR.states.error.invalid_response);
  });

  it('não oferece retry para no_data, mas oferece para timeout', async () => {
    vi.mocked(searchCities).mockResolvedValue([curitiba]);
    vi.mocked(getWeather).mockRejectedValueOnce(new WeatherServiceError('no_data'));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Curitiba');
    });
    expect(result.current.canRetry).toBe(false);

    vi.mocked(getWeather).mockRejectedValueOnce(new WeatherServiceError('timeout'));
    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.errorKind).toBe('timeout');
    expect(result.current.canRetry).toBe(true);
  });

  it('descarta a resposta de uma busca antiga quando outra busca foi feita depois (E-12, E-13)', async () => {
    const slowCuritiba = deferred<City[]>();
    vi.mocked(searchCities).mockImplementation((term) =>
      term === 'Curitiba' ? slowCuritiba.promise : Promise.resolve([lisboa]),
    );
    vi.mocked(getWeather).mockImplementation(async (city) => ({ ...lisboaWeather, city }));
    const { result } = renderHook(() => useWeather());

    let firstSearch!: Promise<void>;
    act(() => {
      firstSearch = result.current.search('Curitiba');
    });
    await act(async () => {
      await result.current.search('Lisboa');
    });

    await act(async () => {
      slowCuritiba.resolve([curitiba]);
      await firstSearch;
    });

    expect(result.current.data?.city.name).toBe('Lisboa');
    expect(result.current.cities).toEqual([lisboa]);
    expect(getWeather).not.toHaveBeenCalledWith(curitiba);
  });

  it('repete a previsão da mesma cidade ao tentar novamente após falha na previsão (AC-07.2)', async () => {
    vi.mocked(searchCities).mockResolvedValue([curitiba]);
    vi.mocked(getWeather)
      .mockRejectedValueOnce(new WeatherServiceError('network'))
      .mockResolvedValueOnce(mockWeatherData);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Curitiba');
    });
    expect(result.current.status).toBe('error');

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.status).toBe('success');
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(getWeather).toHaveBeenLastCalledWith(curitiba);
  });

  it('não refaz a busca de cidades ao tentar novamente após falha na previsão (AC-07.2)', async () => {
    vi.mocked(searchCities).mockResolvedValue([curitiba]);
    vi.mocked(getWeather)
      .mockRejectedValueOnce(new WeatherServiceError('network'))
      .mockResolvedValueOnce(mockWeatherData);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Curitiba');
    });
    await act(async () => {
      await result.current.retry();
    });

    expect(searchCities).toHaveBeenCalledTimes(1);
  });
});
