import { useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { norm, buildPosMap } from '../lib/data';
import type { AppData, Category } from '../types';

interface RankingPanelProps {
  data: AppData;
  onPlayerClick: (nombre: string) => void;
  onFechaChange: (fecha: string) => void;
}

type CatFilter = 'todos' | Category;

export function RankingPanel({ data, onPlayerClick, onFechaChange }: RankingPanelProps) {
  const { rankingByFecha, fechaKeys, currentFecha, playerStats, playerPhotos } = data;
  const [catFilter, setCatFilter] = useState<CatFilter>('todos');
  const [search, setSearch] = useState('');

  const players = currentFecha ? (rankingByFecha[currentFecha] || []) : [];
  const curIdx  = fechaKeys.indexOf(currentFecha || '');
  const prevKey = curIdx > 0 ? fechaKeys[curIdx - 1] : null;
  const isFirst = curIdx === 0;
  const hasMulti = fechaKeys.length > 1;

  const prevMap  = useMemo(() => buildPosMap(prevKey ? rankingByFecha[prevKey] : null), [rankingByFecha, prevKey]);
  const firstMap = useMemo(() => buildPosMap(rankingByFecha[fechaKeys[0]]),             [rankingByFecha, fechaKeys]);

  // Category positions within current ranking
  const catPosMap = useMemo(() => {
    const m: Record<string, number> = {};
    const cc: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    [...players]
      .sort((a, b) => (a.posNum || 99) - (b.posNum || 99))
      .forEach(p => {
        if (p.categoria && cc[p.categoria] !== undefined) {
          cc[p.categoria]++;
          m[norm(p.nombre)] = cc[p.categoria];
        }
      });
    return m;
  }, [players]);

  const filtered = useMemo(() => {
    let list = catFilter === 'todos' ? players : players.filter(p => p.categoria === catFilter);
    if (search) list = list.filter(p => norm(p.nombre).includes(norm(search)));
    return list;
  }, [players, catFilter, search]);

  const cats: { key: CatFilter; label: string }[] = [
    { key: 'todos', label: 'Todos'  },
    { key: 'A',     label: 'Cat. A' },
    { key: 'B',     label: 'Cat. B' },
    { key: 'C',     label: 'Cat. C' },
    { key: 'D',     label: 'Cat. D' },
  ];

  const catActiveClass: Record<string, string> = {
    todos: 'bg-[rgba(232,82,26,0.12)] text-[#E8521A] border-[rgba(232,82,26,0.4)]',
    A: 'bg-[rgba(232,82,26,0.10)] text-[#E8521A] border-[rgba(232,82,26,0.30)]',
    B: 'bg-[rgba(245,166,35,0.10)] text-[#f5a623] border-[rgba(245,166,35,0.30)]',
    C: 'bg-[rgba(79,195,247,0.08)] text-[#4fc3f7] border-[rgba(79,195,247,0.30)]',
    D: 'bg-[rgba(129,199,132,0.08)] text-[#81c784] border-[rgba(129,199,132,0.30)]',
  };

  return (
    <div className="animate-in space-y-4">

      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl text-text tracking-wide">RANKING</h2>
          <div className="section-label mt-0.5">{currentFecha || '—'}</div>
        </div>

        {/* Date navigator */}
        {hasMulti && (
          <div className="flex items-center gap-2">
            <button
              disabled={curIdx <= 0}
              onClick={() => curIdx > 0 && onFechaChange(fechaKeys[curIdx - 1])}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-surface-3 flex items-center justify-center text-text-subtle hover:border-[#E8521A] hover:text-[#E8521A] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <select
              value={currentFecha || ''}
              onChange={e => onFechaChange(e.target.value)}
              className="bg-surface-2 text-text border border-surface-3 rounded-lg px-3 py-1.5 text-sm font-medium font-mono outline-none hover:border-[#E8521A] transition-colors cursor-pointer"
            >
              {fechaKeys.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button
              disabled={curIdx >= fechaKeys.length - 1}
              onClick={() => curIdx < fechaKeys.length - 1 && onFechaChange(fechaKeys[curIdx + 1])}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-surface-3 flex items-center justify-center text-text-subtle hover:border-[#E8521A] hover:text-[#E8521A] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Category pills ── */}
      <div className="flex gap-2 flex-wrap">
        {cats.map(c => (
          <button
            key={c.key}
            onClick={() => setCatFilter(c.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border transition-all ${
              catFilter === c.key
                ? catActiveClass[c.key]
                : 'bg-surface-2 text-text-muted border-surface-3 hover:border-surface-5 hover:text-text-subtle'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar jugador…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-2 text-text border border-surface-3 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-[rgba(232,82,26,0.5)] transition-colors placeholder:text-text-muted"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-3 flex-wrap text-[0.65rem] text-text-muted items-center">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-[rgba(232,82,26,0.12)] border border-[rgba(232,82,26,0.3)]" />
          Top 8 cat.
        </span>
        <span className="flex items-center gap-1.5"><span className="text-[#4dff91] font-bold">▲</span> vs anterior</span>
        <span className="flex items-center gap-1.5"><span className="text-[#ff5c5c] font-bold">▼</span> vs anterior</span>
        {hasMulti && curIdx > 0 && (
          <span className="flex items-center gap-1.5"><span className="text-[#E8521A] font-bold">△</span> vs inicio</span>
        )}
        <span className="flex items-center gap-1.5 ml-auto opacity-60">Tap → perfil</span>
      </div>

      {/* ── Player rows ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          {search ? 'Sin resultados para esa búsqueda.' : 'Sin jugadores en esta categoría.'}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((p, idx) => {
            const displayPos = catFilter === 'todos' ? (p.pos || '—') : String(idx + 1);
            const catPos     = catPosMap[norm(p.nombre)] || (idx + 1);
            const isTop1     = catPos === 1;
            const isTop8     = catPos <= 8;
            const photoUrl   = playerPhotos[norm(p.nombre)];

            const stKey = Object.keys(playerStats).find(k => norm(k) === norm(p.nombre));
            const st    = stKey ? playerStats[stKey] : null;
            const wins   = st?.wins   ?? 0;
            const losses = st?.losses ?? 0;
            const gf     = st?.gf     ?? 0;
            const gc     = st?.gc     ?? 0;
            const dif    = gf - gc;

            // Variation vs previous
            let varPrev: React.ReactNode = null;
            if (hasMulti && !isFirst) {
              const prev = prevMap[norm(p.nombre)];
              if (prev === undefined) {
                varPrev = <span className="text-[0.6rem] font-bold text-[#4fc3f7] tracking-wider">NEW</span>;
              } else {
                const d = prev - p.posNum;
                if (d > 0)      varPrev = <span className="text-[#4dff91] font-bold text-xs">▲{d}</span>;
                else if (d < 0) varPrev = <span className="text-[#ff5c5c] font-bold text-xs">▼{Math.abs(d)}</span>;
                else            varPrev = <span className="text-text-muted text-xs">—</span>;
              }
            }

            // Variation vs start
            let varInicio: React.ReactNode = null;
            if (hasMulti && curIdx > 0) {
              const first = firstMap[norm(p.nombre)];
              if (first === undefined) {
                varInicio = <span className="text-[0.6rem] font-bold text-[#4fc3f7] tracking-wider">NEW</span>;
              } else {
                const d = first - p.posNum;
                if (d > 0)      varInicio = <span className="text-[#E8521A] font-bold text-xs">△{d}</span>;
                else if (d < 0) varInicio = <span className="text-[#ff5c5c] text-xs">▽{Math.abs(d)}</span>;
                else            varInicio = <span className="text-text-muted text-xs">—</span>;
              }
            }

            const rowClass =
              isTop1 && catFilter !== 'todos' ? 'row-top1' :
              isTop8 && catFilter !== 'todos' ? 'row-top8 hover:bg-[rgba(232,82,26,0.06)]' :
              'hover:bg-surface-2';

            return (
              <button
                key={p.nombre}
                onClick={() => onPlayerClick(p.nombre)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${rowClass}`}
              >
                {/* Position number */}
                <div className={`rank-num text-xl w-8 text-right flex-shrink-0 ${
                  isTop1 && catFilter !== 'todos' ? 'text-[#E8521A]' :
                  isTop8 && catFilter !== 'todos' ? 'text-text' : 'text-text-muted'
                }`}>
                  {displayPos}
                </div>

                {/* Avatar */}
                <PlayerAvatar nombre={p.nombre} photoUrl={photoUrl} categoria={p.categoria} size="sm" />

                {/* Name & category */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate transition-colors ${
                    search && norm(p.nombre).includes(norm(search)) ? 'text-[#E8521A]' : 'text-text group-hover:text-text'
                  }`}>
                    {p.nombre}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.categoria && catFilter === 'todos' && (
                      <span className={`cat-badge cat-${p.categoria.toLowerCase()}`}>CAT {p.categoria}</span>
                    )}
                    {catFilter === 'todos' && catPos > 0 && (
                      <span className="text-[0.58rem] text-text-muted">#{catPos} cat.</span>
                    )}
                  </div>
                </div>

                {/* Variations — hidden on xs */}
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                  {hasMulti && !isFirst && <div className="w-10 text-right">{varPrev}</div>}
                  {hasMulti && curIdx > 0 && <div className="w-10 text-right">{varInicio}</div>}
                </div>

                {/* Record */}
                <div className="flex-shrink-0 text-right">
                  {(wins > 0 || losses > 0) ? (
                    <>
                      <div className="text-xs">
                        <span className="text-[#4dff91] font-bold">{wins}G</span>
                        <span className="text-text-muted mx-0.5">/</span>
                        <span className="text-[#ff5c5c] font-bold">{losses}P</span>
                      </div>
                      <div className={`text-xs font-bold ${dif > 0 ? 'text-[#E8521A]' : dif < 0 ? 'text-[#ff5c5c]' : 'text-text-muted'}`}>
                        {dif > 0 ? `+${dif}` : dif}
                      </div>
                    </>
                  ) : (
                    <span className="text-text-muted text-xs">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
