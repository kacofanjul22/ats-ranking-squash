import React, { useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { norm, buildPosMap } from '../lib/data';

interface RankingPanelProps {
  data: any;
  onPlayerClick: (nombre: string) => void;
  onFechaChange: (fecha: string) => void;
}

type CatFilter = 'todos' | 'A' | 'B' | 'C' | 'D';

export function RankingPanel({ data, onPlayerClick, onFechaChange }: RankingPanelProps) {
  // Extraemos de forma segura el flag loading enviado por useAppData
  const { rankingData = [], fechasData = [], currentFecha, playerStats = {}, playerPhotos = {}, loading = false } = data;
  const [catFilter, setCatFilter] = useState<CatFilter>('todos');
  const [search, setSearch] = useState('');

  const fechaKeys = useMemo(() => (fechasData || []).map((f: any) => f.nombre), [fechasData]);
  
  // 🛡️ ESCUDO ANTI-DUPLICADOS: Filtra y asegura filas únicas por jugador en el frontend
  const players = useMemo(() => {
    const vistos = new Set();
    return (rankingData || []).filter((p: any) => {
      if (!p || !p.nombre) return false;
      const llave = norm(p.nombre);
      if (vistos.has(llave)) return false;
      vistos.add(llave);
      return true;
    });
  }, [rankingData]);

  const curIdx  = fechaKeys.indexOf(currentFecha || '');
  const prevKey = curIdx > 0 ? fechaKeys[curIdx - 1] : null;
  const isFirst = curIdx === 0;
  const hasMulti = fechaKeys.length > 1;

  const rankingByFecha: any = data.rankingByFecha || {};
  const prevMap  = useMemo(() => buildPosMap(prevKey ? rankingByFecha[prevKey] : null), [rankingByFecha, prevKey]);
  const firstMap = useMemo(() => buildPosMap(fechaKeys[0] ? rankingByFecha[fechaKeys[0]] : null), [rankingByFecha, fechaKeys]);

  const catPosMap = useMemo(() => {
    const m: Record<string, number> = {};
    const cc: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    [...players]
      .sort((a: any, b: any) => {
        const posA = a.posicion || a.posicion_actual || a.posNum || 99;
        const posB = b.posicion || b.posicion_actual || b.posNum || 99;
        return posA - posB;
      })
      .forEach((p: any) => {
        if (p.categoria && cc[p.categoria] !== undefined) {
          cc[p.categoria]++;
          m[norm(p.nombre)] = cc[p.categoria];
        }
      });
    return m;
  }, [players]);

  const filtered = useMemo(() => {
    let list = catFilter === 'todos' ? players : players.filter((p: any) => p.categoria === catFilter);
    if (search) list = list.filter((p: any) => norm(p.nombre).includes(norm(search)));
    
    return [...list].sort((a: any, b: any) => {
      const posA = a.posicion || a.posicion_actual || a.posNum || 999;
      const posB = b.posicion || b.posicion_actual || b.posNum || 999;
      return posA - posB;
    });
  }, [players, catFilter, search]);

  const cats: { key: CatFilter; label: string }[] = [
    { key: 'todos', label: 'Todos'  },
    { key: 'A',      label: 'Cat. A' },
    { key: 'B',      label: 'Cat. B' },
    { key: 'C',      label: 'Cat. C' },
    { key: 'D',      label: 'Cat. D' },
  ];

  const catActiveClass: Record<string, string> = {
    todos: 'bg-[rgba(232,82,26,0.12)] text-[#E8521A] border-[rgba(232,82,26,0.4)] shadow-[0_0_12px_rgba(232,82,26,0.15)]',
    A: 'bg-[rgba(232,82,26,0.10)] text-[#E8521A] border-[rgba(232,82,26,0.30)]',
    B: 'bg-[rgba(245,166,35,0.10)] text-[#f5a623] border-[rgba(245,166,35,0.30)]',
    C: 'bg-[rgba(79,195,247,0.08)] text-[#4fc3f7] border-[rgba(79,195,247,0.30)]',
    D: 'bg-[rgba(129,199,132,0.08)] text-[#81c784] border-[rgba(129,199,132,0.30)]',
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-4">
      
      {/* HEADER DE POSICIONES */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl text-text tracking-wide">RANKING</h2>
          <div className="section-label mt-0.5 font-mono text-[#E8521A] tracking-wider">{currentFecha || '—'}</div>
        </div>

        {hasMulti && (
          <div className="flex items-center gap-2">
            <button
              disabled={curIdx <= 0 || loading}
              onClick={() => curIdx > 0 && onFechaChange(fechaKeys[curIdx - 1])}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-surface-3 flex items-center justify-center text-text-subtle hover:border-[#E8521A] hover:text-[#E8521A] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <select
              disabled={loading}
              value={currentFecha || ''}
              onChange={e => onFechaChange(e.target.value)}
              className="bg-surface-2 text-text border border-surface-3 rounded-lg px-3 py-1.5 text-sm font-medium font-mono outline-none hover:border-[#E8521A] transition-all cursor-pointer disabled:opacity-50"
            >
              {fechaKeys.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button
              disabled={curIdx >= fechaKeys.length - 1 || loading}
              onClick={() => curIdx < fechaKeys.length - 1 && onFechaChange(fechaKeys[curIdx + 1])}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-surface-3 flex items-center justify-center text-text-subtle hover:border-[#E8521A] hover:text-[#E8521A] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* FILTROS DE CATEGORÍA */}
      <div className="flex gap-2 flex-wrapEste">
        {cats.map(c => (
          <button
            key={c.key}
            disabled={loading}
            onClick={() => setCatFilter(c.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border transition-all ${
              catFilter === c.key
                ? catActiveClass[c.key]
                : 'bg-surface-2 text-text-muted border-surface-3 hover:border-surface-4 hover:text-text-subtle disabled:opacity-40'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* INPUT DE BÚSQUEDA */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          disabled={loading}
          type="text"
          placeholder="Buscar jugador por nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-2 text-text border border-surface-3 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-[rgba(232,82,26,0.5)] transition-all placeholder:text-text-muted disabled:opacity-50"
        />
        {search && !loading && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* REFERENCIAS DE VARIACIÓN */}
      <div className="flex gap-3 flex-wrap text-[0.65rem] text-text-muted items-center px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-[rgba(232,82,26,0.12)] border border-[rgba(232,82,26,0.4)]" />
          Top 8 cat.
        </span>
        <span className="flex items-center gap-1.5"><span className="text-[#4dff91] font-bold">▲</span> vs etapa ant.</span>
        <span className="flex items-center gap-1.5"><span className="text-[#ff5c5c] font-bold">▼</span> vs etapa ant.</span>
        {hasMulti && curIdx > 0 && (
          <span className="flex items-center gap-1.5"><span className="text-[#E8521A] font-bold">△</span> vs apertura</span>
        )}
        <span className="flex items-center gap-1.5 ml-auto opacity-60 font-mono">Tap fila → historial</span>
      </div>

      {/* CONTENEDOR CENTRAL: SKELETON O FILAS REALES */}
      <div key={`${currentFecha}-${catFilter}`} className="space-y-1 animate-in fade-in duration-250">
        {loading ? (
          /* ── SKELETON LOADER FANTASMA (CALCO DE FILA REAL ATS) ── */
          <div className="space-y-1">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-1/40 border border-surface-3/10 animate-pulse">
                {/* Posición fantasma */}
                <div className="w-8 h-5 bg-surface-3/40 rounded ml-auto flex-shrink-0" />
                {/* Avatar circular fantasma */}
                <div className="w-8 h-8 rounded-full bg-surface-3/40 border border-white/5 flex-shrink-0" />
                {/* Nombre y Badge fantasma */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-3.5 bg-surface-3/50 rounded w-1/2 min-w-[140px]" />
                  <div className="h-2.5 bg-surface-3/20 rounded w-16" />
                </div>
                {/* Bloques de variación ocultos en móvil fantasma */}
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  <div className="w-8 h-3 bg-surface-3/30 rounded" />
                  <div className="w-8 h-3 bg-surface-3/30 rounded" />
                </div>
                {/* Stats G/P a la derecha fantasma */}
                <div className="space-y-1 text-right flex-shrink-0">
                  <div className="h-3 bg-surface-3/40 rounded w-10 ml-auto" />
                  <div className="h-2.5 bg-surface-3/30 rounded w-6 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm glass-card rounded-2xl border-dashed border-surface-3">
            {search ? 'Sin resultados para esa búsqueda.' : 'Sin jugadores registrados en esta categoría.'}
          </div>
        ) : (
          /* RENDERIZADO DE FILAS DE JUGADORES REALES */
          filtered.map((p: any, idx: number) => {
            const currentPosNum = p.posicion || p.posicion_actual || p.posNum || (idx + 1);
            const displayPos = catFilter === 'todos' ? String(currentPosNum) : String(idx + 1);
            const catPos     = catPosMap[norm(p.nombre)] || (idx + 1);
            const isTop1     = catPos === 1;
            const isTop8     = catPos <= 8;
            
            const photoUrl = p.foto_url || playerPhotos[norm(p.nombre)];

            const stKey = Object.keys(playerStats).find(k => norm(k) === norm(p.nombre));
            const st    = stKey ? playerStats[stKey] : null;
            const wins   = st?.wins   ?? 0;
            const losses = st?.losses ?? 0;
            const gf     = st?.gf     ?? 0;
            const gc     = st?.gc     ?? 0;
            const dif    = gf - gc;

            let varPrev: React.ReactNode = null;
            if (hasMulti && !isFirst) {
              const prev = prevMap[norm(p.nombre)];
              if (prev === undefined) {
                varPrev = <span className="text-[0.6rem] font-bold text-[#4fc3f7] tracking-wider bg-[#4fc3f7]/10 px-1 rounded">NEW</span>;
              } else {
                const d = prev - currentPosNum;
                if (d > 0)      varPrev = <span className="text-[#4dff91] font-bold text-xs">▲{d}</span>;
                else if (d < 0) varPrev = <span className="text-[#ff5c5c] font-bold text-xs">▼{Math.abs(d)}</span>;
                else            varPrev = <span className="text-text-muted text-xs opacity-40">—</span>;
              }
            }

            let varInicio: React.ReactNode = null;
            if (hasMulti && curIdx > 0) {
              const first = firstMap[norm(p.nombre)];
              if (first === undefined) {
                varInicio = <span className="text-[0.6rem] font-bold text-[#4fc3f7] tracking-wider bg-[#4fc3f7]/10 px-1 rounded">NEW</span>;
              } else {
                const d = first - currentPosNum;
                if (d > 0)      varInicio = <span className="text-[#E8521A] font-bold text-xs">△{d}</span>;
                else if (d < 0) varInicio = <span className="text-[#ff5c5c] text-xs">▽{Math.abs(d)}</span>;
                else            varInicio = <span className="text-text-muted text-xs opacity-40">—</span>;
              }
            }

            const rowClass =
              isTop1 && catFilter !== 'todos' ? 'row-top1 border border-[#E8521A]/30 bg-[#E8521A]/5 shadow-[0_0_15px_rgba(232,82,26,0.05)]' :
              isTop8 && catFilter !== 'todos' ? 'row-top8 hover:bg-[rgba(232,82,26,0.06)] border border-transparent' :
              'hover:bg-surface-2/60 border border-transparent';

            return (
              <button
                key={p.nombre}
                onClick={() => onPlayerClick(p.nombre)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group transform hover:scale-[1.005] ${rowClass}`}
              >
                {/* Puesto */}
                <div className={`rank-num text-xl w-8 text-right flex-shrink-0 font-mono ${
                  isTop1 && catFilter !== 'todos' ? 'text-[#E8521A] font-extrabold' :
                  isTop8 && catFilter !== 'todos' ? 'text-text font-bold' : 'text-text-muted'
                }`}>
                  {displayPos}
                </div>

                {/* Avatar Component */}
                <PlayerAvatar nombre={p.nombre} photoUrl={photoUrl} categoria={p.categoria} size="sm" />

                {/* Datos Principales */}
                <div className="flex-1 min-w-0 pl-1">
                  <div className={`font-medium text-sm truncate transition-colors ${
                    search && norm(p.nombre).includes(norm(search)) ? 'text-[#E8521A] font-bold' : 'text-text group-hover:text-text'
                  }`}>
                    {p.nombre}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.categoria && catFilter === 'todos' && (
                      <span className={`cat-badge cat-${p.categoria.toLowerCase()}`}>CAT {p.categoria}</span>
                    )}
                    {catFilter === 'todos' && catPos > 0 && (
                      <span className="text-[0.58rem] text-text-muted font-sans flex items-center gap-0.5">
                        {isTop1 ? <Trophy size={9} className="text-[#ffc107] inline" /> : '#'}
                        {catPos} en cat.
                      </span>
                    )}
                  </div>
                </div>

                {/* Indicadores de Variación en Pantallas Medianas/Grandes */}
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0 font-mono">
                  {hasMulti && !isFirst && <div className="w-10 text-right">{varPrev}</div>}
                  {hasMulti && curIdx > 0 && <div className="w-10 text-right">{varInicio}</div>}
                </div>

                {/* Rendimiento G/P en Etapa */}
                <div className="flex-shrink-0 text-right font-mono min-w-[55px]">
                  {(wins > 0 || losses > 0) ? (
                    <>
                      <div className="text-xs font-bold">
                        <span className="text-[#4dff91]">{wins}G</span>
                        <span className="text-text-muted mx-0.5 opacity-40">/</span>
                        <span className="text-[#ff5c5c]">{losses}P</span>
                      </div>
                      <div className={`text-[0.68rem] font-extrabold ${dif > 0 ? 'text-[#E8521A]' : dif < 0 ? 'text-[#ff5c5c]' : 'text-text-muted'}`}>
                        {dif > 0 ? `+${dif}` : dif} DG
                      </div>
                    </>
                  ) : (
                    <span className="text-text-muted text-xs opacity-40 font-sans">—</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}