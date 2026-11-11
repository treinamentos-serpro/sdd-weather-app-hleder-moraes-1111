export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  admin1: string | null;
}

export interface CurrentWeather {
  // Hora local da cidade, sem offset (ex.: "2026-11-11T15:00")
  time: string;
  // Temperaturas em °C; null quando ausente ou inválido no payload
  temperature: number | null;
  apparentTemperature: number | null;
  // Código WMO bruto; texto e ícone são derivados na UI
  weatherCode: number | null;
  isDay: boolean;
  // Umidade relativa em %
  humidity: number | null;
  // Vento a 10 m em km/h
  windSpeed: number | null;
  // Precipitação em mm
  precipitation: number | null;
  // Pressão ao nível do mar em hPa
  pressure: number | null;
}

// Grupo de ícone derivado do código WMO (plano 4.2)
export type ConditionGroup =
  | 'sun'
  | 'partly-cloudy'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

// Chave do rótulo pt-BR em text/pt-BR.ts (D-01)
export type WeatherLabelKey =
  | 'clearSky'
  | 'mainlyClear'
  | 'partlyCloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'freezingDrizzle'
  | 'rain'
  | 'freezingRain'
  | 'snow'
  | 'snowGrains'
  | 'rainShowers'
  | 'snowShowers'
  | 'thunderstorm'
  | 'thunderstormHail'
  | 'unknown';

export interface WeatherCondition {
  labelKey: WeatherLabelKey;
  group: ConditionGroup;
}

// Tipos de falha da camada de serviço; a UI escolhe mensagem e botão por tipo (plano 4.5)
export type WeatherErrorKind =
  | 'network'
  | 'timeout'
  | 'server'
  | 'rate_limit'
  | 'invalid_response'
  | 'no_data';

export interface ForecastDay {
  // Dia local da cidade (ex.: "2026-11-11")
  date: string;
  temperatureMax: number | null;
  temperatureMin: number | null;
  weatherCode: number | null;
}

export interface WeatherData {
  city: City;
  // Fuso IANA informado pela API (ex.: "America/Sao_Paulo")
  timezone: string;
  current: CurrentWeather;
  // Até 5 dias, em ordem crescente de date
  daily: ForecastDay[];
}
