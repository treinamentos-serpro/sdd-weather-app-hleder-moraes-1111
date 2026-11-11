import { useCallback, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import { ptBR } from '../text/pt-BR';
import type { City, WeatherData, WeatherErrorKind } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export interface UseWeatherResult {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  /** Mensagem amigável para o `errorKind` atual. */
  error: string | null;
  errorKind: WeatherErrorKind | null;
  /** `no_data` não tem retry: repetir a mesma coordenada não muda o resultado. */
  canRetry: boolean;
  query: string;
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

type LastOperation = { kind: 'search'; name: string } | { kind: 'select'; city: City };

export function useWeather(): UseWeatherResult {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [errorKind, setErrorKind] = useState<WeatherErrorKind | null>(null);
  const [query, setQuery] = useState('');

  // Respostas de operações antigas são descartadas quando um novo id é emitido.
  const latestRequestId = useRef(0);
  const lastOperation = useRef<LastOperation | null>(null);

  const loadWeather = useCallback(async (city: City, requestId: number) => {
    setStatus('loading');
    setData(null);
    setErrorKind(null);
    try {
      const weather = await getWeather(city);
      if (requestId !== latestRequestId.current) return;
      setData(weather);
      setStatus('success');
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      setStatus('error');
      setErrorKind(toErrorKind(err));
    }
  }, []);

  const search = useCallback(
    async (name: string) => {
      const term = name.trim();
      const requestId = ++latestRequestId.current;
      setQuery(term);
      setData(null);
      setCities([]);
      setErrorKind(null);

      if (!term) {
        setStatus('idle');
        return;
      }

      // Se a busca falhar, o retry repete a busca. Se falhar depois, repete só a previsão.
      lastOperation.current = { kind: 'search', name: term };
      setStatus('loading');
      try {
        const results = await searchCities(term);
        if (requestId !== latestRequestId.current) return;
        if (results.length === 0) {
          setStatus('empty');
          return;
        }
        // A primeira correspondência é carregada automaticamente; a lista fica disponível para troca.
        setCities(results);
        lastOperation.current = { kind: 'select', city: results[0] };
        await loadWeather(results[0], requestId);
      } catch (err) {
        if (requestId !== latestRequestId.current) return;
        setStatus('error');
        setErrorKind(toErrorKind(err));
      }
    },
    [loadWeather],
  );

  const selectCity = useCallback(
    async (city: City) => {
      const requestId = ++latestRequestId.current;
      lastOperation.current = { kind: 'select', city };
      await loadWeather(city, requestId);
    },
    [loadWeather],
  );

  const retry = useCallback(async () => {
    const operation = lastOperation.current;
    if (!operation) return;
    if (operation.kind === 'search') {
      await search(operation.name);
    } else {
      await selectCity(operation.city);
    }
  }, [search, selectCity]);

  const error = errorKind ? ptBR.states.error[errorKind] : null;
  const canRetry = errorKind !== null && errorKind !== 'no_data';

  return {
    status,
    data,
    cities,
    error,
    errorKind,
    canRetry,
    query,
    search,
    selectCity,
    retry,
  };
}

function toErrorKind(err: unknown): WeatherErrorKind {
  if (err instanceof WeatherServiceError) return err.kind;
  return 'invalid_response';
}
