import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Trophy, Percent, Flame, TrendingUp, TrendingDown, Sparkles, Shield } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { norm, computeFullStats } from '../lib/data';
import type { AppData, PlayerFullStats } from '../types';

interface StatsPanelProps {
  data: AppData;
}

type SortCol = keyof PlayerFullStats;
type CatFilter = 'todos' | import('../types').Category;

function StatRankList({ title, icon, items, renderValue }: { 
  title: string; icon: React.ReactNode; items: PlayerFullStats[]; renderValue: (p: PlayerFullStats) => React.ReactNode 
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col h-[380px]">
      <div className="flex items-center gap-2 pb-3 border-b border-surface-3 mb-2">
        <div className="text-[#E8521A]">{icon}</div>
        <h3 className="font-display text-lg tracking-wide text-text uppercase">{title}</h3>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
        {items.length === 0 ? (
          <div className="text-center py-12 text-xs text-text-muted">Sin jugadores registrados</div>
        ) : (
          items.map((p, idx) => (
            <div key={p.nombre} className="flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-surface-2/50 transition-colors">
              <span className="rank-num text-sm text-text-muted w-5 text-right">{idx + 1}</span>
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
  const { rankingByFecha, fechaKeys, currentFecha, playerStats, playerPhotos, resultadosData } = data;
  const [catFilter, setCatFilter] = useState<CatFilter>('todos');
  const [sortCol, setSortCol] = useState<SortCol>('posActual');
  const [sortDesc, setSortDesc] = useState(false);

  const players = currentFecha ? (rankingByFecha[currentFecha] || []) : [];
  const firstPlayers = fechaKeys.length > 0 ? (rankingByFecha[fechaKeys[0]] || []) : [];

  const allStats = useMemo(
    () => computeFullStats(players, firstPlayers, playerStats, resultadosData),
    [players, firstPlayers, playerStats, resultadosData],
  );

  const filteredStats = useMemo(() => {
    let list = catFilter === 'todos' ? allStats : allStats.filter(p => p.cat === catFilter);
    return [...list].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'string') return sortDesc ? (vb as string).localeCompare(va) : va.localeCompare(vb as string);
      return sortDesc ? (vb as number) - (va as number) : (va as number) - (vb as number);
    });
  }, [allStats, catFilter, sortCol, sortDesc]);

  const listasNuevas = useMemo(() => {
    const conPartidos = allStats.filter(p => p.total > 0);

    const topVictorias = [...conPartidos]
      .filter(p => p.wins > 0)
      .sort((a, b) => b.wins - a.wins || b.pct - a.pct)
      .slice(0, 10);

    const topEfectividad = [...conPartidos]
      .filter(p => p.total >= 2)
      .sort((a, b) => b.pct - a.pct || b.wins - a.wins)
      .slice(0, 10);

    const invictos = conPartidos
      .filter(p => p.losses === 0 && p.wins > 0)
      .sort((a, b) => b.wins - a.wins);

    const escaladas = allStats
      .filter(p => p.subida !== null && p.subida > 0)
      .sort((a, b) => (b.subida || 0) - (a.subida || 0));

    const caidas = allStats
      .filter(p => p.subida !== null && p.subida < 0)
      .sort((a, b) => (a.subida || 0) - (b.subida || 0));

    const rachas = conPartidos
      .filter(p => p.rachaActual > 1)
      .sort((a, b) => b.rachaActual - a.rachaActual);

    const perfectGames = conPartidos
      .filter(p => p.gc === 0 && p.gf > 0)
      .sort((a, b) => b.gf - a.gf);

    return { topVictorias, topEfectividad, invictos, escaladas, caidas, rachas, perfectGames };
  }, [allStats]);

  const cats: { key: CatFilter; label: string }[] = [
    { key: 'todos', label: 'General' },
    { key: 'A', label: 'Cat. A' },
    { key: 'B', label: 'Cat. B' },
    { key: 'C', label: 'Cat. C' },
    { key: 'D', label: 'Cat. D' },
  ];

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else { setSortCol(col); setSortDesc(true); }
  };

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <span className="text-text-muted opacity-30 ml-0.5">↕</span>;
    return sortDesc
      ? <ChevronDown size={11} className="inline text-[#E8521A] ml-0.5" />
      : <ChevronUp size={11} className="inline text-[#E8521A] ml-0.5" />;
  };

  return (
    <div className="animate-in space-y-7">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl text-text tracking-wide">
          ESTADÍSTICAS <span className="text-[#E8521A]">🏆</span>
        </h2>
        <div className="section-label mt-0.5">Highlights competitivos y rendimiento analítico</div>
      </div>

      <div>
        <div className="section-label mb-3">⭐ Líderes de la temporada</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatRankList 
            title="Top 10 Victorias" 
            icon={<Trophy size={18} />} 
            items={listasNuevas.topVictorias} 
            renderValue={(p) => <span className="text-[#4dff91]">{p.wins} G</span>}
          />
          <StatRankList 
            title="Top 10 Efectividad" 
            icon={<Percent size={18} />} 
            items={listasNuevas.topEfectividad} 
            renderValue={(p) => <span className="text-[#ffc107]">{p.pct}%</span>}
          />
          <StatRankList 
            title="Jugadores Invictos" 
            icon={<Flame size={18} />} 
            items={listasNuevas.invictos} 
            renderValue={(p) => <span className="text-gradient font-extrabold">🔥 {p.wins}-0</span>}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card rounded-2xl p-4 flex flex-col h-[240px]">
          <div className="flex items-center gap-1.5 pb-2 border-b border-surface-3 mb-2 text-[#4dff91]">
            <TrendingUp size={15} />
            <span className="text-[0.65rem] font-bold tracking-wider uppercase">Mayor Escalada (▲)</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 text-xs">
            {listasNuevas.escaladas.length === 0 ? <div className="text-text-muted text-center py-8">Ninguno</div> :
              listasNuevas.escaladas.map(p => (
                <div key={p.nombre} className="flex justify-between py-0.5 text-text-subtle">
                  <span className="truncate pr-2">{p.nombre}</span>
                  <span className="text-[#4dff91] font-bold flex-shrink-0">▲{p.subida}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-col h-[240px]">
          <div className="flex items-center gap-1.5 pb-2 border-b border-surface-3 mb-2 text-[#ff5c5c]">
            <TrendingDown size={15} />
            <span className="text-[0.65rem] font-bold tracking-wider uppercase">Mayor Caída (▼)</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 text-xs">
            {listasNuevas.caidas.length === 0 ? <div className="text-text-muted text-center py-8">Ninguno</div> :
              listasNuevas.caidas.map(p => (
                <div key={p.nombre} className="flex justify-between py-0.5 text-text-subtle">
                  <span className="truncate pr-2">{p.nombre}</span>
                  <span className="text-[#ff5c5c] font-semibold flex-shrink-0">▼{Math.abs(p.subida || 0)}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-col h-[240px]">
          <div className="flex items-center gap-1.5 pb-2 border-b border-surface-3 mb-2 text-orange-400">
            <Sparkles size={15} />
            <span className="text-[0.65rem] font-bold tracking-wider uppercase">Rachas Activas</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 text-xs">
            {listasNuevas.rachas.length === 0 ? <div className="text-text-muted text-center py-8">No hay rachas activas</div> :
              listasNuevas.rachas.map(p => (
                <div key={p.nombre} className="flex justify-between py-0.5 text-text-subtle">
                  <span className="truncate pr-2">{p.nombre}</span>
                  <span className="text-orange-400 font-bold flex-shrink-0">🔥 {p.rachaActual}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-col h-[240px]">
          <div className="flex items-center gap-1.5 pb-2 border-b border-surface-3 mb-2 text-[#4fc3f7]">
            <Shield size={15} />
            <span className="text-[0.65rem] font-bold tracking-wider uppercase">Arco Invicto (0 GC)</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 text-xs">
            {listasNuevas.perfectGames.length === 0 ? <div className="text-text-muted text-center py-8">Ninguno</div> :
              listasNuevas.perfectGames.map(p => (
                <div key={p.nombre} className="flex justify-between py-0.5 text-text-subtle">
                  <span className="truncate pr-2">{p.nombre}</span>
                  <span className="text-[#4fc3f7] font-bold flex-shrink-0">+{p.gf} games</span>
                </div>
              ))
            }
          </div>
        </div>

      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="section-label">📊 Tabla completa interactiva</div>
          
          <div className="flex gap-1.5 flex-wrap">
            {cats.map(c => (
              <button
                key={c.key}
                onClick={() => setCatFilter(c.key)}
                className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wider border transition-all ${
                  catFilter === c.key
                    ? 'bg-[rgba(232,82,26,0.12)] text-[#E8521A] border-[rgba(232,82,26,0.4)]'
                    : 'bg-surface-2 text-text-muted border-surface-3 hover:border-surface-5 hover:text-text-subtle'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-surface-3">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-3 bg-surface-1">
                {[
                  { key: 'posActual' as SortCol, label: '#'       },
                  { key: 'nombre'    as SortCol, label: 'Jugador' },
                  { key: 'cat'       as SortCol, label: 'Cat.'    },
                  { key: 'wins'      as SortCol, label: 'G'       },
                  { key: 'losses'    as SortCol, label: 'P'       },
                  { key: 'total'     as SortCol, label: 'Pts'     },
                  { key: 'pct'       as SortCol, label: '%'       },
                  { key: 'dif'       as SortCol, label: 'Dif.'    },
                  { key: 'subida'    as SortCol, label: 'Var.'    },
                  { key: 'rachaActual' as SortCol, label: 'Racha' },
                ].map(col => (
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
            <tbody>
              {filteredStats.map((p, i) => {
                const photoUrl = playerPhotos[norm(p.nombre)];
                return (
                  <tr key={p.nombre} className={`border-b border-surface-3/50 hover:bg-surface-2 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-1/30'}`}>
                    <td className="px-3 py-2.5">
                      <span className="rank-num text-lg text-text-muted">{p.posActual ?? '—'}</span>
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
                      <span className="text-[#4dff91] font-bold">{p.wins}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[#ff5c5c] font-bold">{p.losses}</span>
                    </td>
                    <td className="px-3 py-2.5 text-text-subtle">{p.total}</td>
                    <td className="px-3 py-2.5 font-semibold text-text-subtle">{p.pct}%</td>
                    <td className="px-3 py-2.5">
                      <span className={p.dif > 0 ? 'text-[#E8521A] font-bold' : p.dif < 0 ? 'text-[#ff5c5c]' : 'text-text-muted'}>
                        {p.dif > 0 ? `+${p.dif}` : p.dif}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {p.subida === null ? '—' : p.subida > 0
                        ? <span className="text-[#4dff91] font-bold">▲{p.subida}</span>
                        : p.subida < 0
                        ? <span className="text-[#ff5c5c]">▼{Math.abs(p.subida)}</span>
                        : <span className="text-text-muted">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5">
                      {p.rachaActual > 1
                        ? <span className="text-[#4dff91] font-bold">🔥{p.rachaActual}</span>
                        : p.rachaActual < -1
                        ? <span className="text-[#ff5c5c]">{p.rachaActual}</span>
                        : <span className="text-text-muted">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}