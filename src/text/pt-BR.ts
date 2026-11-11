import type { WeatherErrorKind, WeatherLabelKey } from '../types/weather';

export const ptBR = {
  app: {
    brand: 'WeatherView',
    footer: 'Dados por',
    idle: {
      title: 'Pesquise uma cidade para ver o clima.',
      hint: 'Ex.: Curitiba, Lisboa, São Paulo',
    },
    empty: {
      title: (query: string) => `Nenhuma cidade encontrada para "${query}".`,
      hint: 'Verifique o nome digitado.',
    },
  },
  search: {
    label: 'Buscar cidade',
    placeholder: 'Ex.: Curitiba',
    submit: 'Buscar',
  },
  unit: {
    group: 'Unidade de temperatura',
    celsius: '°C',
    fahrenheit: '°F',
    changedTo: {
      celsius: 'Unidade alterada para Celsius',
      fahrenheit: 'Unidade alterada para Fahrenheit',
    },
  },
  weather: {
    clearSky: 'Céu limpo',
    mainlyClear: 'Predominantemente limpo',
    partlyCloudy: 'Parcialmente nublado',
    overcast: 'Nublado',
    fog: 'Nevoeiro',
    drizzle: 'Garoa leve, moderada ou intensa',
    freezingDrizzle: 'Garoa congelante',
    rain: 'Chuva leve, moderada ou forte',
    freezingRain: 'Chuva congelante',
    snow: 'Neve leve, moderada ou forte',
    snowGrains: 'Grãos de neve',
    rainShowers: 'Pancadas de chuva leves, moderadas ou violentas',
    snowShowers: 'Pancadas de neve',
    thunderstorm: 'Trovoada',
    thunderstormHail: 'Trovoada com granizo',
    unknown: 'Condição indisponível',
  } satisfies Record<WeatherLabelKey, string>,
  states: {
    loading: 'Carregando...',
    retry: 'Tentar novamente',
    error: {
      network: 'Não foi possível carregar o clima. Tente novamente.',
      timeout: 'Não foi possível carregar o clima. Tente novamente.',
      server: 'Não foi possível carregar o clima. Tente novamente.',
      invalid_response: 'Não foi possível carregar o clima. Tente novamente.',
      rate_limit: 'Muitas consultas em pouco tempo. Tente novamente em instantes.',
      no_data: 'Sem dados disponíveis para esta cidade.',
    } satisfies Record<WeatherErrorKind, string>,
  },
  forecast: {
    title: 'Previsão',
    incomplete: (shown: number, total: number) =>
      `Previsão incompleta: ${shown} de ${total} dias disponíveis`,
    max: 'Máx.',
    min: 'Mín.',
  },
  current: {
    feelsLike: (value: string) => `Sensação de ${value}`,
    updatedAt: (time: string) => `Atualizado às ${time}`,
    metrics: {
      humidity: 'Umidade',
      wind: 'Vento',
      precipitation: 'Precipitação',
      pressure: 'Pressão',
    },
  },
} as const;
