import React, { useState, useMemo } from 'react';
import { norm } from '../lib/data';
import { ChevronLeft, ChevronRight, Calendar, Trophy, Clock } from 'lucide-react';

interface PartidosPanelProps {
  data: any;
}

// 🌟 Formateador estricto que lee los rangos reales de la base de datos
function formatPeriodLabel(inicioStr?: string, finStr?: string): string {
  if (!inicioStr || !finStr) return 'Período no definido';
  
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  // Forzamos zona horaria local al parsear el string YYYY-MM-DD
  const inicio = new Date(inicioStr + 'T12:00:00');
  const fin = new Date(finStr + 'T12:00:00');

  return `Del ${inicio.getDate()} de ${meses[inicio.getMonth()]} al ${fin.getDate()} de ${meses[fin.getMonth()]} (${fin.getFullYear()})`;
}

function progressPct(inicioStr?: string, finStr?: string): number {
  if (!inicioStr || !finStr) return 0;
  const now = new Date();
  const inicio = new Date(inicioStr + 'T00:00:00').getTime();
  const fin = new Date(finStr + 'T23:59:59').getTime();
  
  const total = fin - inicio;
  const elapsed = now.getTime() - inicio;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function PartidosPanel({ data }: PartidosPanelProps) {
  // Sincronizamos con un posible flag de loading global del hook useAppData
  const { resultadosData = [], currentFecha, rankingData = [], fechasData = [], loading = false } = data;

  const fechaKeys = useMemo(() => (fechasData || []).map((f: any) => f.nombre), [fechasData]);
  const [selectedFecha, setSelectedFecha] = useState<string>(currentFecha || fechaKeys[fechaKeys.length - 1] || 'Fecha 6');

  const curIdx = fechaKeys.indexOf(selectedFecha);
  const hasMulti = fechaKeys.length > 1;
  const isCurrentActive = norm(selectedFecha) === norm(currentFecha || '');

  const periods = useMemo(() => {
    const map: Record<string, any[]> = {};
    resultadosData.forEach((r: any) => {
      const fechaNormalizada = norm(r.fecha);
      if (!map[fechaNormalizada]) map[fechaNormalizada] = [];
      map[fechaNormalizada].push(r);
    });
    return map;
  }, [resultadosData]);

  const selectedMatches = useMemo(() => {
    return periods[norm(selectedFecha)] || [];
  }, [periods, selectedFecha]);

  const players = rankingData || [];

  const stats = useMemo(() => {
    const total = selectedMatches.length;
    const played = selectedMatches.filter((r: any) => {
      const gd = r.games_d !== null && r.games_d !== '' ? parseInt(r.games_d) : NaN;
      const ga = r.games_a !== null && r.games_a !== '' ? parseInt(r.games_a) : NaN;
      return !isNaN(gd) && !isNaN(ga);
    }).length;
    return { total, played, pending: total - played };
  }, [selectedMatches]);

  // Extraemos el objeto fila de la fecha seleccionada
  const selectedFechaObj = fechasData.find((f: any) => norm(f.nombre) === norm(selectedFecha));
  
  const labelPeriodo = formatPeriodLabel(selectedFechaObj?.fecha_inicio, selectedFechaObj?.fecha_fin);
  const pct = progressPct(selectedFechaObj?.fecha_inicio, selectedFechaObj?.fecha_fin);
  
  // Cálculo exacto de días restantes basado en la fecha de cierre real
  const diasRestantes = useMemo(() => {
    if (!isCurrentActive || !selectedFechaObj?.fecha_fin) return 0;
    const finEtapa = new Date(selectedFechaObj.fecha_fin + 'T23:59:59').getTime();
    const hoy = new Date().getTime();
    return Math.max(0, Math.ceil((finEtapa - hoy) / 86_400_000));
  }, [isCurrentActive, selectedFechaObj]);

  const posMap: Record<string, number> = {};
  players.forEach((p: any) => { posMap[norm(p.nombre)] = p.posicion || p.posNum || 0; });

  const desafios = useMemo(() => {
    return selectedMatches
      .map((r: any) => {
        const gd = r.games_d !== null && r.games_d !== '' ? parseInt(r.games_d) : NaN;
        const ga = r.games_a !== null && r.games_a !== '' ? parseInt(r.games_a) : NaN;
        
        const played = !isNaN(gd) && !isNaN(ga);
        const isNoJugado = played && gd === 0 && ga === 0;
        const winnerIsD = played && gd > ga;
        
        const nombreDes = r.jugador_d || r.desafiante || '';
        const nombreAce = r.jugador_a || r.aceptante || '';
        
        const posDes = posMap[norm(nombreDes)];
        const posAce = posMap[norm(nombreAce)];
        return { 
          ...r, 
          played, 
          isNoJugado, 
          winnerIsD, 
          posDes, 
          posAce, 
          gd: isNaN(gd) ? null : gd, 
          ga: isNaN(ga) ? null : ga, 
          nombreDes, 
          nombreAce 
        };
      })
      .sort((a: any, b: any) => {
        if (a.played !== b.played) return a.played ? -1 : 1;
        if (a.nota === '1er Puesto') return -1;
        if (b.nota === '1er Puesto') return 1;
        return 0;
      });
  }, [selectedMatches, posMap]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-5">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl text-text tracking-wide">
            PARTIDOS <span className="text-[#E8521A]">&amp; DESAFÍOS</span>
          </h2>
          <div className="section-label mt-0.5">Torneo Oficial ATS</div>
        </div>

        {hasMulti && (
          <div className="flex items-center gap-2">
            <button
              disabled={curIdx <= 0 || loading}
              onClick={() => curIdx > 0 && setSelectedFecha(fechaKeys[curIdx - 1])}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-surface-3 flex items-center justify-center text-text-subtle hover:border-[#E8521A] hover:text-[#E8521A] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <select
              disabled={loading}
              value={selectedFecha}
              onChange={e => setSelectedFecha(e.target.value)}
              className="bg-surface-2 text-text border border-surface-3 rounded-lg px-3 py-1.5 text-sm font-medium font-mono outline-none hover:border-[#E8521A] transition-all cursor-pointer disabled:opacity-50"
            >
              {fechaKeys.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button
              disabled={curIdx >= fechaKeys.length - 1 || loading}
              onClick={() => curIdx < fechaKeys.length - 1 && setSelectedFecha(fechaKeys[curIdx + 1])}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-surface-3 flex items-center justify-center text-text-subtle hover:border-[#E8521A] hover:text-[#E8521A] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ESTADO DEL PERÍODO / HISTORIAL */}
      {loading ? (
        <div className="glass-card rounded-2xl p-5 animate-pulse space-y-3">
          <div className="flex justify-between w-full">
            <div className="h-3.5 bg-surface-3/50 rounded w-1/3" />
            <div className="h-3.5 bg-surface-3/30 rounded w-16" />
          </div>
          <div className="h-2 bg-surface-4 rounded-full w-full" />
        </div>
      ) : isCurrentActive ? (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-surface-3/20 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#E8521A]" />
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div>
              <div className="text-[0.6rem] text-text-muted tracking-wider uppercase mb-1 flex items-center gap-1">
                <Clock size={10} className="text-[#E8521A]" /> Etapa Oficial Activa
              </div>
              <div className="font-semibold text-sm text-[#E8521A]">{selectedFecha} <span className="text-text-subtle/80 font-normal font-sans">— {labelPeriodo}</span></div>
            </div>
            <div className="text-right">
              <div className="text-[0.6rem] text-text-muted tracking-wider uppercase mb-1">Tiempo restante</div>
              <div className="font-semibold text-sm text-text bg-surface-3/40 px-2 py-0.5 rounded-md border border-white/5 inline-block font-mono">{diasRestantes} día{diasRestantes !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="h-1.5 bg-surface-4 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#E8521A] to-[#ff7a45] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-right text-[0.6rem] text-text-muted mt-1 font-mono">{pct}% del período transcurrido</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-3/60 bg-surface-2/40 p-4 text-center text-xs text-text-muted backdrop-blur-sm">
          🔒 Historial Cerrado: La {selectedFecha} ({labelPeriodo}) se encuentra finalizada de forma oficial.
        </div>
      )}

      {/* BLOQUE DE CONTADORES */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { val: stats.total,   label: 'Total',     color: 'text-[#E8521A]', bg: 'group-hover:border-[#E8521A]/20' },
          { val: stats.played,  label: 'Jugados',   color: 'text-[#4dff91]', bg: 'group-hover:border-[#4dff91]/20' },
          { val: stats.pending, label: 'Pendientes', color: 'text-text-muted', bg: 'group-hover:border-surface-4' },
        ].map((s: any) => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center border border-transparent transition-all group duration-300">
            {loading ? (
              <div className="h-8 bg-surface-3/40 rounded w-12 mx-auto animate-pulse" />
            ) : (
              <div className={`stat-value text-3xl sm:text-4xl font-mono ${s.color}`}>{s.val}</div>
            )}
            <div className="text-[0.6rem] text-text-muted tracking-wider uppercase mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* CONTROL DE ENTRADA Y SKELETON LOADERS DE FILAS */}
      <div key={selectedFecha} className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {loading ? (
          /* REPLICACIÓN ESPEJO DE MÁSCARAS FANTASMA */
          <div className="space-y-2">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-surface-3/20 bg-surface-1/30 animate-pulse">
                <div className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[32px]">
                  <div className="w-5 h-4 bg-surface-3/50 rounded" />
                  <div className="w-2 h-2 bg-surface-3/20 rounded" />
                  <div className="w-5 h-4 bg-surface-3/40 rounded" />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-3 bg-surface-3/50 rounded w-2/3 min-w-[130px]" />
                  <div className="h-2 bg-surface-3/20 rounded w-6" />
                  <div className="h-3 bg-surface-3/40 rounded w-1/2 min-w-[90px]" />
                </div>
                <div className="w-14 h-7 bg-surface-3/30 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : desafios.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm glass-card rounded-2xl border-dashed border-surface-3">
            No hay partidos cargados para este período.
          </div>
        ) : (
          /* RENDERIZADO DE ENCUENTROS REALES */
          desafios.map((d: any, i: number) => {
            const isSpecial = d.nota === '1er Puesto';
            return (
              <div 
                key={i} 
                className={`rounded-2xl px-4 py-3 flex items-center gap-3 border transition-all duration-200 transform hover:scale-[1.005] hover:shadow-md ${
                  isSpecial 
                    ? 'border-[rgba(255,193,7,0.35)] bg-gradient-to-r from-[rgba(255,193,7,0.08)] to-transparent shadow-[0_0_15px_rgba(255,193,7,0.03)]' 
                    : 'glass-card border-transparent hover:border-surface-3/80 hover:bg-surface-2/60'
                }`}
              >
                {/* Indicadores de Posiciones Cruzadas */}
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0 min-w-[32px] bg-background/40 py-1 px-1.5 rounded-lg border border-white/5 font-mono">
                  <span className={`rank-num text-sm font-bold leading-none ${isSpecial ? 'text-[#ffc107]' : 'text-[#E8521A]'}`}>
                    {d.posDes || '?'}
                  </span>
                  <span className="text-text-muted text-[0.45rem] opacity-40">↕</span>
                  <span className="rank-num text-sm font-bold leading-none text-text-subtle">
                    {d.posAce || '?'}
                  </span>
                </div>

                {/* Bloque Central de Competidores */}
                <div className="flex-1 min-w-0 pl-1">
                  <div className={`font-semibold text-sm truncate tracking-wide ${d.isNoJugado ? 'text-text-muted/60 line-through' : d.played && d.winnerIsD ? 'text-[#4dff91]' : d.played ? 'text-text-muted' : 'text-text'}`}>
                    {d.nombreDes}
                  </div>
                  <div className="flex items-center gap-2 my-0.5">
                    <span className="text-[0.5rem] text-text-muted font-mono uppercase tracking-widest opacity-50">VS</span>
                    {isSpecial && (
                      <span className="bg-[#ffc107]/10 text-[#ffc107] border border-[#ffc107]/20 text-[0.55rem] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse flex items-center gap-1">
                        <Trophy size={8} /> Partido por el #1
                      </span>
                    )}
                  </div>
                  <div className={`font-semibold text-sm truncate tracking-wide ${d.isNoJugado ? 'text-text-muted/60 line-through' : d.played && !d.winnerIsD ? 'text-[#4dff91]' : d.played ? 'text-text-muted' : 'text-text'}`}>
                    {d.nombreAce}
                  </div>
                </div>

                {/* Marcadores Laterales o Badges de Estado */}
                {d.played && !d.isNoJugado && d.gd !== null && d.ga !== null ? (
                  <div className="text-right flex-shrink-0 bg-background/60 px-2.5 py-1 rounded-xl border border-white/5 min-w-[40px] font-mono shadow-inner">
                    <div className={`rank-num text-lg font-bold leading-tight ${d.winnerIsD ? 'text-[#4dff91] drop-shadow-[0_0_6px_rgba(77,255,145,0.2)]' : 'text-text-muted'}`}>{d.gd}</div>
                    <div className={`rank-num text-lg font-bold leading-tight ${!d.winnerIsD ? 'text-[#4dff91] drop-shadow-[0_0_6px_rgba(77,255,145,0.2)]' : 'text-text-muted'}`}>{d.ga}</div>
                  </div>
                ) : d.isNoJugado ? (
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider border bg-surface-3/50 text-text-muted border-surface-4/40">
                    No Jugado
                  </span>
                ) : (
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider border transition-all ${
                    isSpecial ? 'bg-[#ffc107]/10 text-[#ffc107] border-[#ffc107]/30 shadow-[0_0_8px_rgba(255,193,7,0.1)]' : 'bg-surface-3 text-text-muted border-transparent group-hover:border-surface-4'
                  }`}>
                    Pendiente
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}