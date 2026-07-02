import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Trophy, Percent, Flame, TrendingUp, TrendingDown, Sparkles, Shield } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { norm, computeFullStats } from '../lib/data';

interface StatsPanelProps {
  data: any;
}

type CatFilter = 'todos' | 'A' | 'B' | 'C' | 'D';

/* REFACTORIZADO: Ahora acepta flag de loading nativo */
function StatRankList({ title, icon, items, renderValue, loading }: { 
  title: string; icon: React.ReactNode; items: any[]; renderValue: (p: any) => React.ReactNode; loading?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col h-[380px] border border-surface-3/10">
      <div className="flex items-center gap-2 pb-3 border-b border-surface-3 mb-2">
        <div className="text-[#E8521A]">{icon}</div>
        <h3 className="font-display text-lg tracking-wide text-text uppercase">{title}</h3>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
        {loading ? (
          /* Máscara fantasma interna */
          [...Array(5)].map((_, idx) => (
            <div key={idx} className="flex items-center gap-2.5 py-1.5 px-1.5 animate-pulse">
              <div className="w-4 h-4 bg-surface-3/40 rounded flex-shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="h-3 bg-surface-3/50 rounded w-2/3" />
                <div className="h-2 bg-surface-3/20 rounded w-10" />
              </div>
              <div className="w-10 h-4 bg-surface-3/30 rounded flex-shrink-0" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-xs text-text-muted">Sin jugadores registrados</div>
        ) : (
          items.map((p: any, idx: number) => (
            <div key={p.nombre} className="flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-surface-2/50 transition-colors">
              <span className="rank-num text-sm text-text-muted w-5 text-right font-mono">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-text truncate">{p.nombre}</div>
                {p.cat && <span className={`cat-badge cat-${p.cat.toLowerCase()} text-[0.55rem] px-1 mt-0.5`}>CAT {p.cat}</span>}
              </div>
              <div className="text-right flex-shrink-0 font-mono text-xs font-bold">
                {renderValue(p)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function StatsPanel({ data }: StatsPanelProps) {
  // Sincronizamos de manera segura con el cargador global
  const { rankingData = [], fechasData = [], playerStats = {}, playerPhotos = {}, resultadosData = [], rankingByFecha = {}, loading = false } = data;
  const [catFilter, setCatFilter] = useState<CatFilter>('todos');
  const [sortCol, setSortCol] = useState<string>('posActual');
  const [sortDesc, setSortDesc] = useState(false);

  const fechaKeys = useMemo(() => (fechasData || []).map((f: any) => f.nombre), [fechasData]);
  
  const players = useMemo(() => rankingData.map((p: any) => ({ ...p, posNum: p.posicion || p.posNum || 1 })), [rankingData]);
  
  const firstPlayers = useMemo(() => {
    const firstKey = fechaKeys[0];
    const firstList = firstKey ? rankingByFecha[firstKey] : null;
    if (!firstList || firstList.length === 0) return players;
    return firstList.map((p: any) => ({ ...p, posNum: p.posicion || p.posNum || 1 }));
  }, [rankingByFecha, fechaKeys, players]);

  const allStats = useMemo(
    () => computeFullStats(players, firstPlayers, playerStats, resultadosData),
    [players, firstPlayers, playerStats, resultadosData],
  );

  const filteredStats = useMemo(() => {
    let list = catFilter === 'todos' ? allStats : allStats.filter((p: any) => p.cat === catFilter);
    return [...list].sort((a: any, b: any) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'string') return sortDesc ? (vb as string).localeCompare(va) : va.localeCompare(vb as string);
      return sortDesc ? (vb as number) - (va as number) : (va as number) - (vb as number);
    });
  }, [allStats, catFilter, sortCol, sortDesc]);

  const listasNuevas = useMemo(() => {
    const conPartidos = allStats.filter((p: any) => p.total > 0);

    const topVictorias = [...conPartidos]
      .filter((p: any) => p.wins > 0)
      .sort((a: any, b: any) => b.wins - a.wins || b.pct - a.pct)
      .slice(0, 10);

    const topEfectividad = [...conPartidos]
      .filter((p: any) => p.total >= 2)
      .sort((a: any, b: any) => b.pct - a.pct || b.wins - a.wins)
      .slice(0, 10);

    const invictos = conPartidos
      .filter((p: any) => p.losses === 0 && p.wins > 0)
      .sort((a: any, b: any) => b.wins - a.wins);

    const escaladas = allStats
      .filter((p: any) => p.subida !== null && p.subida > 0)
      .sort((a: any, b: any) => (b.subida || 0) - (a.subida || 0));

    const caidas = allStats
      .filter((p: any) => p.subida !== null && p.subida < 0)
      .sort((a: any, b: any) => (a.subida || 0) - (b.subida || 0));

    const rachas = conPartidos
      .filter((p: any) => p.rachaActual > 1)
      .sort((a: any, b: any) => b.rachaActual - a.rachaActual);

    const perfectGames = conPartidos
      .filter((p: any) => p.gc === 0 && p.gf > 0)
      .sort((a: any, b: any) => b.gf - a.gf);

    return { topVictorias, topEfectividad, invictos, escaladas, caidas, rachas, perfectGames };
  }, [allStats]);

  const cats: { key: CatFilter; label: string }[] = [
    { key: 'todos', label: 'General' },
    { key: 'A', label: 'Cat. A' },
    { key: 'B', label: 'Cat. B' },
    { key: 'C', label: 'Cat. C' },
    { key: 'D', label: 'Cat. D' },
  ];

  const handleSort = (col: string) => {
    if (loading) return;
    if (sortCol === col) setSortDesc(!sortDesc);
    else { setSortCol(col); setSortDesc(true); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <span className="text-text-muted opacity-30 ml-0.5 font-sans">↕</span>;
    return sortDesc
      ? <ChevronDown size={11} className="inline text-[#E8521A] ml-0.5" />
      : <ChevronUp size={11} className="inline text-[#E8521A] ml-0.5" />;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-7">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl text-text tracking-wide">
          ESTADÍSTICAS <span className="text-[#E8521A]">🏆</span>
        </h2>
        <div className="section-label mt-0.5">Highlights competitivos y rendimiento analítico</div>
      </div>

      {/* TRES GRANDES LISTAS DE DESTACADOS */}
      <div>
        <div className="section-label mb-3">⭐ Líderes de la temporada</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatRankList title="Top 10 Victorias" icon={<Trophy size={18} />} items={listasNuevas.topVictorias} renderValue={(p) => <span className="text-[#4dff91]">{p.wins} G</span>} loading={loading} />
          <StatRankList title="Top 10 Efectividad" icon={<Percent size={18} />} items={listasNuevas.topEfectividad} renderValue={(p) => <span className="text-[#ffc107]">{p.pct}%</span>} loading={loading} />
          <StatRankList title="Jugadores Invictos" icon={<Flame size={18} />} items={listasNuevas.invictos} renderValue={(p) => <span className="text-gradient font-extrabold">🔥 {p.wins}-0</span>} loading={loading} />
        </div>
      </div>

      {/* CUADRO DE MÉTRICAS COMPLEMENTARIAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mayor Escalada */}
        <div className="glass-card rounded-2xl p-4 flex flex-col h-[240px] border border-surface-3/10">
          <div className="flex items-center gap-1.5 pb-2 border-b border-surface-3 mb-2 text-[#4dff91]">
            <TrendingUp size={15} />
            <span className="text-[0.65rem] font-bold tracking-wider uppercase">Mayor Escalada (▲)</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 text-xs">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-3 bg-surface-3/30 rounded w-3/4 animate-pulse" />)
            ) : listasNuevas.escaladas.length === 0 ? <div className="text-text-muted text-center py-8">Ninguno</div> :
              listasNuevas.escaladas.map((p: any) => (
                <div key={p.nombre} className="flex justify-between py-0.5 text-text-subtle">
                  <span className="truncate pr-2">{p.nombre}</span>
                  <span className="text-[#4dff91] font-bold flex-shrink-0 font-mono">▲{p.subida}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Mayor Caída */}
        <div className="glass-card rounded-2xl p-4 flex flex-col h-[240px] border border-surface-3/10">
          <div className="flex items-center gap-1.5 pb-2 border-b border-surface-3 mb-2 text-[#ff5c5c]">
            <TrendingDown size={15} />
            <span className="text-[0.65rem] font-bold tracking-wider uppercase">Mayor Caída (▼)</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 text-xs">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-3 bg-surface-3/30 rounded w-3/4 animate-pulse" />)
            ) : listasNuevas.caidas.length === 0 ? <div className="text-text-muted text-center py-8">Ninguno</div> :
              listasNuevas.caidas.map((p: any) => (
                <div key={p.nombre} className="flex justify-between py-0.5 text-text-subtle">
                  <span className="truncate pr-2">{p.nombre}</span>
                  <span className="text-[#ff5c5c] font-semibold flex-shrink-0 font-mono">▼{Math.abs(p.subida || 0)}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Rachas Activas */}
        <div className="glass-card rounded-2xl p-4 flex flex-col h-[240px] border border-surface-3/10">
          <div className="flex items-center gap-1.5 pb-2 border-b border-surface-3 mb-2 text-orange-400">
            <Sparkles size={15} />
            <span className="text-[0.65rem] font-bold tracking-wider uppercase">Rachas Activas</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 text-xs">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-3 bg-surface-3/30 rounded w-3/4 animate-pulse" />)
            ) : listasNuevas.rachas.length === 0 ? <div className="text-text-muted text-center py-8">No hay rachas activas</div> :
              listasNuevas.rachas.map((p: any) => (
                <div key={p.nombre} className="flex justify-between py-0.5 text-text-subtle">
                  <span className="truncate pr-2">{p.nombre}</span>
                  <span className="text-orange-400 font-bold flex-shrink-0 font-mono">🔥 {p.rachaActual}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Arco Invicto */}
        <div className="glass-card rounded-2xl p-4 flex flex-col h-[240px] border border-surface-3/10">
          <div className="flex items-center gap-1.5 pb-2 border-b border-surface-3 mb-2 text-[#4fc3f7]">
            <Shield size={15} />
            <span className="text-[0.65rem] font-bold tracking-wider uppercase">Arco Invicto (0 GC)</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 text-xs">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-3 bg-surface-3/30 rounded w-3/4 animate-pulse" />)
            ) : listasNuevas.perfectGames.length === 0 ? <div className="text-text-muted text-center py-8">Ninguno</div> :
              listasNuevas.perfectGames.map((p: any) => (
                <div key={p.nombre} className="flex justify-between py-0.5 text-text-subtle">
                  <span className="truncate pr-2">{p.nombre}</span>
                  <span className="text-[#4fc3f7] font-bold flex-shrink-0 font-mono">+{p.gf} games</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* SECCIÓN INTERACTIVA INFERIOR COMPLETA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="section-label">📊 Tabla completa interactiva</div>
          <div className="flex gap-1.5 flex-wrap">
            {cats.map(c => (
              <button
                key={c.key}
                disabled={loading}
                onClick={() => setCatFilter(c.key)}
                className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wider border transition-all ${
                  catFilter === c.key
                    ? 'bg-[rgba(232,82,26,0.12)] text-[#E8521A] border-[rgba(232,82,26,0.4)] shadow-sm'
                    : 'bg-surface-2 text-text-muted border-surface-3 hover:border-surface-4 hover:text-text-subtle disabled:opacity-40'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-surface-3">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-3 bg-surface-1">
                {[
                  { key: 'posActual', label: '#'       },
                  { key: 'nombre',    label: 'Jugador' },
                  { key: 'cat',       label: 'Cat.'    },
                  { key: 'wins',      label: 'G'       },
                  { key: 'losses',    label: 'P'       },
                  { key: 'total',     label: 'Pts'     },
                  { key: 'pct',       label: '%'       },
                  { key: 'dif',       label: 'Dif.'    },
                  { key: 'subida',    label: 'Var.'    },
                  { key: 'rachaActual', label: 'Racha' },
                ].map((col: any) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-3 py-3 text-[0.6rem] font-bold tracking-widest uppercase text-text-muted cursor-pointer hover:text-text-subtle whitespace-nowrap select-none transition-colors"
                  >
                    {col.label}<SortIcon col={col.key} />
                  </th>
                ))}
              </tr>
            </thead>
            {/* Control dinámico de animación en renderizado del cuerpo */}
            <tbody key={catFilter} className="animate-in fade-in duration-200">
              {loading ? (
                /* RENDERIZADO DE LÍNEAS FANTASMA INTEGRADO AL ESQUELETO DE LA TABLA NATIVA */
                [...Array(5)].map((_, rIdx) => (
                  <tr key={rIdx} className="border-b border-surface-3/50 bg-surface-1/10 animate-pulse">
                    <td className="px-3 py-3"><div className="w-5 h-5 bg-surface-3/40 rounded" /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-surface-3/40 border border-white/5 flex-shrink-0" />
                        <div className="w-24 h-3.5 bg-surface-3/40 rounded" />
                      </div>
                    </td>
                    {[...Array(8)].map((_, cIdx) => (
                      <td key={cIdx} className="px-3 py-3">
                        <div className="w-8 h-3.5 bg-surface-3/30 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                filteredStats.map((p: any, i: number) => {
                  const photoUrl = playerPhotos[norm(p.nombre)];
                  return (
                    <tr key={p.nombre} className={`border-b border-surface-3/50 hover:bg-surface-2/40 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-1/30'}`}>
                      <td className="px-3 py-2.5">
                        <span className="rank-num text-lg text-text-muted font-mono">{p.posActual ?? '—'}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-[140px]">
                          <PlayerAvatar nombre={p.nombre} photoUrl={photoUrl} categoria={p.cat} size="sm" />
                          <span className="font-medium text-text truncate max-w-[120px]">{p.nombre}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {p.cat ? <span className={`cat-badge cat-${p.cat.toLowerCase()}`}>{p.cat}</span> : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[#4dff91] font-bold font-mono">{p.wins}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[#ff5c5c] font-bold font-mono">{p.losses}</span>
                      </td>
                      <td className="px-3 py-2.5 text-text-subtle font-mono">{p.total}</td>
                      <td className="px-3 py-2.5 font-semibold text-text-subtle font-mono">{p.pct}%</td>
                      <td className="px-3 py-2.5 font-mono">
                        <span className={p.dif > 0 ? 'text-[#E8521A] font-bold' : p.dif < 0 ? 'text-[#ff5c5c]' : 'text-text-muted'}>
                          {p.dif > 0 ? `+${p.dif}` : p.dif}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono">
                        {p.subida === null ? '—' : p.subida > 0
                          ? <span className="text-[#4dff91] font-bold">▲{p.subida}</span>
                          : p.subida < 0
                          ? <span className="text-[#ff5c5c]">▼{Math.abs(p.subida)}</span>
                          : <span className="text-text-muted opacity-40">—</span>
                        }
                      </td>
                      <td className="px-3 py-2.5 font-mono">
                        {p.rachaActual > 1 ? (
                          <span className="text-[#4dff91] font-bold">🔥{p.rachaActual}</span>
                        ) : p.rachaActual < -1 ? (
                          <span className="text-[#ff5c5c]">{p.rachaActual}</span>
                        ) : (
                          <span className="text-text-muted opacity-40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}