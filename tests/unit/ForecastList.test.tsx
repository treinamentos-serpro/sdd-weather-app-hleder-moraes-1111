import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import type { ForecastDay } from '../../src/types/weather';

const days: ForecastDay[] = [
  { date: '2026-11-11', temperatureMax: 24.8, temperatureMin: 16.2, weatherCode: 2 },
  { date: '2026-11-12', temperatureMax: null, temperatureMin: 17.0, weatherCode: 1 },
  { date: '2026-11-13', temperatureMax: 22.3, temperatureMin: 15.4, weatherCode: 61 },
  { date: '2026-11-14', temperatureMax: null, temperatureMin: null, weatherCode: null },
  { date: '2026-11-15', temperatureMax: 23.5, temperatureMin: 14.9, weatherCode: 3 },
];

describe('ForecastList com resposta parcial', () => {
  it('mostra "—" na máxima ausente e mantém a mínima do mesmo dia (AC-04.4)', () => {
    render(<ForecastList days={days} unit="celsius" />);

    const tomorrow = screen.getByRole('article', { name: 'Amanhã, 12/11/2026' });
    expect(within(tomorrow).getByText('—')).toBeInTheDocument();
    expect(within(tomorrow).getByText('17 °C')).toBeInTheDocument();
  });

  it('omite o dia sem máxima e mínima e avisa que a previsão está incompleta (AC-04.4)', () => {
    render(<ForecastList days={days} unit="celsius" />);

    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.queryByRole('article', { name: 'Sáb, 14/11/2026' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Previsão incompleta: 4 de 5 dias disponíveis', { exact: true }),
    ).toBeInTheDocument();
  });

  it('mostra apenas os 3 dias recebidos e avisa a quantidade (AC-04.3)', () => {
    render(<ForecastList days={days.slice(0, 3)} unit="celsius" />);

    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(
      screen.getByText('Previsão incompleta: 3 de 5 dias disponíveis', { exact: true }),
    ).toBeInTheDocument();
  });

  it('não mostra aviso de incompleta quando os 5 dias têm dados', () => {
    const complete = days.map((day) => ({
      ...day,
      temperatureMax: day.temperatureMax ?? 20,
      temperatureMin: day.temperatureMin ?? 10,
    }));
    render(<ForecastList days={complete} unit="celsius" />);

    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.queryByText(/Previsão incompleta/)).not.toBeInTheDocument();
  });
});
