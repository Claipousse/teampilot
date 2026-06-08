'use client';

import { useState, useRef, useEffect } from 'react';
import { NATIONALITIES } from '@/lib/nationalities';

interface Props {
  value: string;
  iso: string;
  onChange: (label: string, iso: string) => void;
  error?: string;
}

export default function NationalitySelect({ value, iso, onChange, error }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  const filtered = NATIONALITIES.filter(n =>
    n.label.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const cls = `w-full py-3 pr-4 bg-surface-container border ${error ? 'border-error' : 'border-outline-variant'} rounded-xl text-base text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all ${iso ? 'pl-10' : 'pl-4'}`;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        {iso && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://flagcdn.com/w20/${iso}.png`}
            alt=""
            width={20}
            height={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 rounded-sm object-cover pointer-events-none"
          />
        )}
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Ex : Français"
          className={cls}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-y-auto max-h-48">
          {filtered.map(n => (
            <button
              key={n.iso}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(n.label, n.iso); setQuery(n.label); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container text-sm text-left transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w20/${n.iso}.png`}
                alt=""
                width={20}
                height={15}
                className="rounded-sm object-cover shrink-0"
              />
              <span className="text-on-surface">{n.label}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
