import { useState } from 'react';
import { ptBR } from '../text/pt-BR';
import type { Unit } from '../types/weather';

export interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

const UNITS: readonly Unit[] = ['celsius', 'fahrenheit'];

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const [announcement, setAnnouncement] = useState('');

  function select(next: Unit) {
    if (next === unit) return;
    onChange(next);
    setAnnouncement(ptBR.unit.changedTo[next]);
  }

  return (
    <>
      <div
        role="group"
        aria-label={ptBR.unit.group}
        className="inline-flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1 shadow-glass backdrop-blur-md"
      >
        {UNITS.map((option) => {
          const isActive = option === unit;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isActive}
              onClick={() => select(option)}
              className={`rounded-md px-3 py-1 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 ${
                isActive ? 'bg-accent-500 text-night-900' : 'text-white/60 hover:text-white'
              }`}
            >
              {ptBR.unit[option]}
            </button>
          );
        })}
      </div>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
