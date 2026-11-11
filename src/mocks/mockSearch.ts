import type { WeatherData, WeatherErrorKind } from '../types/weather';
import { mockWeatherData } from './weatherData';

export type MockSearchResult =
  | { status: 'empty' }
  | { status: 'error'; kind: WeatherErrorKind }
  | { status: 'success'; data: WeatherData };

// Dev-only: substitui o serviço de API até ele existir. "vazio" e "erro" forçam os estados.
export function resolveMockSearch(term: string): MockSearchResult {
  const normalized = term.trim().toLowerCase();
  if (normalized === 'vazio') return { status: 'empty' };
  if (normalized === 'erro') return { status: 'error', kind: 'network' };
  return { status: 'success', data: mockWeatherData };
}
