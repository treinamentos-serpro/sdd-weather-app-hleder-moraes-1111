import type { WeatherData } from '../types/weather';

// Dados fictícios para desenvolver a UI sem depender da API Open-Meteo.
export const mockWeatherData: WeatherData = {
  city: {
    id: 3462,
    name: 'Curitiba',
    latitude: -25.4284,
    longitude: -49.2733,
    country: 'Brasil',
    countryCode: 'BR',
    admin1: 'Paraná',
  },
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-11-11T15:00',
    temperature: 21.4,
    apparentTemperature: 22.1,
    weatherCode: 2,
    isDay: true,
    humidity: 78,
    windSpeed: 12.4,
    precipitation: 0.4,
    pressure: 1013.6,
  },
  daily: [
    { date: '2026-11-11', temperatureMax: 24.8, temperatureMin: 16.2, weatherCode: 2 },
    { date: '2026-11-12', temperatureMax: 26.1, temperatureMin: 17.0, weatherCode: 1 },
    { date: '2026-11-13', temperatureMax: 22.3, temperatureMin: 15.4, weatherCode: 61 },
    { date: '2026-11-14', temperatureMax: 19.7, temperatureMin: 13.8, weatherCode: 95 },
    { date: '2026-11-15', temperatureMax: 23.5, temperatureMin: 14.9, weatherCode: 3 },
  ],
};
