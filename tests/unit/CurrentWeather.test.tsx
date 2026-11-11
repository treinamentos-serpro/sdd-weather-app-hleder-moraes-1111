import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { mockWeatherData } from '../../src/mocks/weatherData';
import type { CurrentWeather as CurrentWeatherData } from '../../src/types/weather';

const partial: CurrentWeatherData = {
  ...mockWeatherData.current,
  temperature: 21.4,
  apparentTemperature: null,
  weatherCode: 999,
  humidity: null,
};

describe('CurrentWeather com resposta parcial', () => {
  it('mostra "—" na sensação térmica ausente e mantém a temperatura (AC-03.5)', () => {
    render(<CurrentWeather city={mockWeatherData.city} current={partial} unit="celsius" />);

    expect(screen.getByText('Sensação de —', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('21 °C', { exact: true })).toBeInTheDocument();
  });

  it('mostra "Condição indisponível" para weather_code fora da tabela (AC-03.5, AC-10.2)', () => {
    render(<CurrentWeather city={mockWeatherData.city} current={partial} unit="celsius" />);

    expect(screen.getByText('Condição indisponível', { exact: true })).toBeInTheDocument();
  });

  it('mostra "—" em métricas ausentes sem afetar as demais', () => {
    render(<CurrentWeather city={mockWeatherData.city} current={partial} unit="celsius" />);

    expect(screen.getByText('Vento', { exact: true }).nextElementSibling).toHaveTextContent(
      '12 km/h',
    );
    expect(screen.getByText('Umidade', { exact: true }).nextElementSibling).toHaveTextContent('—');
  });
});
