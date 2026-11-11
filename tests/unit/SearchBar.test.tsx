import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it('não dispara onSearch com campo vazio', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await user.click(screen.getByRole('searchbox', { name: 'Buscar cidade' }));
    await user.keyboard('{Enter}');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('não dispara onSearch com apenas espaços', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), '   {Enter}');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('dispara onSearch com o termo digitado, sem espaços nas bordas', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), '  Curitiba ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('Curitiba');
  });

  it('não dispara onSearch com 1 caractere (AC-01.2, E-02)', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'C{Enter}');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('limita a entrada a 100 caracteres (AC-01.7, E-23)', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} />);
    const input = screen.getByRole('searchbox', { name: 'Buscar cidade' });

    await user.type(input, 'a'.repeat(101));

    expect(input).toHaveValue('a'.repeat(100));
  });
});
