import { useState, useMemo } from 'react';
import type { AppData } from '../types';
import { norm } from '../lib/data';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PartidosPanelProps {
  data: AppData;
}

function getPeriodInfo(): { label: string; inicio: Date; fin: Date } {
  const now = new Date();
  const day = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();

  const p1Start = new Date(year, month, 1);
  const p1End   = new Date(year, month, 14);
  const p2Start = new Date(year, month, 15);
  const p2End   = new Date(year, month + 1, 0);

  if (day >= 1 && day <= 14) {
    return { label: `Período 1 (1 al 14)`, inicio: p1Start, fin: p1End };
  }
  return { label: `Período 2 (15 al ${p2End.getDate()})`, inicio: p2Start, fin: p2End };
}

function progressPct(inicio: Date, fin: Date): number {
  const now = new Date();
  const total = fin.getTime() - inicio.getTime();
  const elapsed = now.getTime() - inicio.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function PartidosPanel({ data }: PartidosPanelProps) {
  const { resultadosData, currentFecha, rankingByFecha, fechaKeys } = data;

  const [selectedFecha, setSelectedFecha] = useState<string>(currentFecha || fechaKeys[0] || '');

  const curIdx = fechaKeys.indexOf(selectedFecha);
  const hasMulti = fechaKeys.length > 1;
  const isCurrentActive = norm(selectedFecha) === norm(currentFecha || '');

  const periods = useMemo(() => {
    const map: Record<string, typeof resultadosData> = {};
    resultadosData.forEach(r => {
      const fechaNormalizada = norm(r.fecha);
      if (!map[fechaNormalizada]) map[fechaNormalizada] = [];
      map[fechaNormalizada].push(r);
    });
    return map;
  }, [resultadosData]);

  const selectedMatches = useMemo(() => {
    return periods[norm(selectedFecha)] || [];
  }, [periods, selectedFecha]);

  const players = currentFecha ? (rankingByFecha[currentFecha] || []) : [];

  const stats = useMemo(() => {
    const total = selectedMatches.length;
    const played = selectedMatches.filter(r => {
      const gd = r.games_d !== null ? parseInt(r.games_d) : NaN;
      const ga = r.games_a !== null ? parseInt(r.games_a) : NaN;
      return !isNaN(gd) && !isNaN(ga) && (gd > 0 || ga > 0);
    }).length;
    return { total, played, pending: total - played };
  }, [selectedMatches]);

  const periodInfo = getPeriodInfo();
  const pct = progressPct(periodInfo.inicio, periodInfo.fin);
  const diasRestantes = Math.max(0, Math.ceil((periodInfo.fin.getTime() - new Date().getTime()) / 86_400_000));

  const posMap: Record<string, number> = {};
  players.forEach(p => { posMap[norm(p.nombre)] = p.posNum; });

  const desafios = useMemo(() => {
    return selectedMatches
      .map(r => {
        const gd = r.games_d !== null ? parseInt(r.games_d) : NaN;
        const ga = r.games_a !== null ? parseInt(r.games_a) : NaN;
        const played = !isNaN(gd) && !isNaN(ga) && (gd > 0 || ga > 0);
        const winnerIsD = played && gd > ga;
        const posDes = posMap[norm(r.desafiante)];
        const posAce = posMap[norm(r.aceptante)];
        return { ...r, played, winnerIsD, posDes, posAce, gd: isNaN(gd) ? null : gd, ga: isNaN(ga) ? null : ga };
      })
      .sort((a, b) => {
        // 1. NUEVO CRITERIO: Primero ordenamos por Jugados vs Pendientes (Jugados arriba)
        if (a.played !== b.played) {
          return a.played ? -1 : 1;
        }
        // 2. Si están en el mismo grupo, el partido por el "1er Puesto" va arriba de su respectiva sección
        if (a.nota === '1er Puesto') return -1;
        if (b.nota === '1er Puesto') return 1;
        return 0;
      });
  }, [selectedMatches, posMap]);

  return (
    <div className="animate-in space-y-5">
      
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl text-text tracking-wide">
            PARTIDOS <span className="text-[#E8521A]">&amp; DESAFÍOS</span>
          </h2>
          <div className="section-label mt-0.5">Sistema de desafíos oficiales</div>
        </div>

        {hasMulti && (
          <div className="flex items-center gap-2">
            <button
              disabled={curIdx <= 0}
              onClick={() => curIdx > 0 && setSelectedFecha(fechaKeys[curIdx - 1])}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-surface-3 flex items-center justify-center text-text-subtle hover:border-[#E8521A] hover:text-[#E8521A] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <select
              value={selectedFecha}
              onChange={e => setSelectedFecha(e.target.value)}
              className="bg-surface-2 text-text border border-surface-3 rounded-lg px-3 py-1.5 text-sm font-medium font-mono outline-none hover:border-[#E8521A] transition-colors cursor-pointer"
            >
              {fechaKeys.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button
              disabled={curIdx >= fechaKeys.length - 1}
              onClick={() => curIdx < fechaKeys.length - 1 && setSelectedFecha(fechaKeys[curIdx + 1])}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-surface-3 flex items-center justify-center text-text-subtle hover:border-[#E8521A] hover:text-[#E8521A] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {isCurrentActive ? (
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div>
              <div className="text-[0.6rem] text-text-muted tracking-wider uppercase mb-1">Período actual activo</div>
              <div className="font-semibold text-sm text-text">{periodInfo.label}</div>
            </div>
            <div className="text-right">
              <div className="text-[0.6rem] text-text-muted tracking-wider uppercase mb-1">Tiempo restante</div>
              <div className="font-semibold text-sm text-text">{diasRestantes} día{diasRestantes !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="h-1.5 bg-surface-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E8521A] rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-right text-[0.6rem] text-text-muted mt-1 font-mono">{pct}%</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-3 bg-surface-2/40 p-4 text-center text-xs text-text-muted">
          🔒 Historial: Esta fecha ya se encuentra cerrada y finalizada.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { val: stats.total,   label: 'Total',     color: 'text-[#E8521A]' },
          { val: stats.played,  label: 'Jugados',   color: 'text-[#4dff91]' },
          { val: stats.pending, label: 'Pendientes', color: 'text-text-muted' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <div className={`stat-value text-3xl sm:text-4xl ${s.color}`}>{s.val}</div>
            <div className="text-[0.6rem] text-text-muted tracking-wider uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {desafios.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          No hay partidos cargados para este período o el nombre de la fecha no coincide con la planilla.
        </div>
      ) : (
        <div className="space-y-2">
          {desafios.map((d, i) => {
            const isSpecial = d.nota === '1er Puesto';
            
            return (
              <div
                key={i}
                className={`rounded-2xl px-4 py-3 flex items-center gap-3 border transition-all ${
                  isSpecial 
                    ? 'border-[rgba(255,193,7,0.35)] bg-gradient-to-r from-[rgba(255,193,7,0.08)] to-transparent shadow-[0_0_15px_rgba(255,193,7,0.03)]' 
                    : 'glass-card border-transparent hover:border-surface-4'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0 min-w-[32px]">
                  <span className={`rank-num text-lg leading-none ${isSpecial ? 'text-[#ffc107]' : 'text-[#E8521A]'}`}>
                    {d.posDes || '?'}
                  </span>
                  <span className="text-text-muted text-[0.5rem] font-mono">↕</span>
                  <span className="rank-num text-lg leading-none text-text-subtle">
                    {d.posAce || '?'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm truncate ${d.played && d.winnerIsD ? 'text-text' : d.played ? 'text-text-muted' : 'text-text'}`}>
                    {d.desafiante}
                  </div>
                  <div className="flex items-center gap-2 my-0.5">
                    <span className="text-[0.55rem] text-text-muted font-mono uppercase tracking-wider">VS</span>
                    {isSpecial && (
                      <span className="bg-[#ffc107]/10 text-[#ffc107] border border-[#ffc107]/20 text-[0.55rem] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
                        🏆 Partido por el #1
                      </span>
                    )}
                  </div>
                  <div className={`font-semibold text-sm truncate ${d.played && !d.winnerIsD ? 'text-text' : d.played ? 'text-text-muted' : 'text-text'}`}>
                    {d.aceptante}
                  </div>
                </div>

                {d.played && d.gd !== null && d.ga !== null ? (
                  <div className="text-right flex-shrink-0">
                    <div className={`rank-num text-2xl leading-none ${d.winnerIsD ? 'text-[#4dff91]' : 'text-text-muted'}`}>{d.gd}</div>
                    <div className={`rank-num text-2xl leading-none ${!d.winnerIsD ? 'text-[#4dff91]' : 'text-text-muted'}`}>{d.ga}</div>
                  </div>
                ) : (
                  <span className={`flex-shrink-0 px-2 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wider border ${
                    isSpecial 
                      ? 'bg-[#ffc107]/10 text-[#ffc107] border-[#ffc107]/20' 
                      : 'bg-surface-3 text-text-muted border-transparent'
                  }`}>
                    Pendiente
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}