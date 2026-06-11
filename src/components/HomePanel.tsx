import { useMemo } from 'react';
import { Trophy, Calendar, BarChart3, Megaphone, Activity } from 'lucide-react';
import type { AppData } from '../types';
import { norm } from '../lib/data';
import { PlayerAvatar } from './PlayerAvatar';

interface HomePanelProps {
  data: AppData;
  onTabChange: (tab: any) => void;
}

export function HomePanel({ data, onTabChange }: HomePanelProps) {
  const { avisosData, rankingByFecha, currentFecha, resultadosData, playerPhotos } = data;

  // 1. Obtener el Top 10 del Ranking Actual
  const top10Players = useMemo(() => {
    const currentRanking = currentFecha ? (rankingByFecha[currentFecha] || []) : [];
    return currentRanking.slice(0, 10);
  }, [rankingByFecha, currentFecha]);

  // 2. Obtener los últimos 5 partidos disputados (con resultado cargado)
  const last5Matches = useMemo(() => {
    if (!resultadosData) return [];
    return [...resultadosData]
      .filter(r => {
        const gd = r.games_d !== null ? parseInt(r.games_d) : NaN;
        const ga = r.games_a !== null ? parseInt(r.games_a) : NaN;
        return !isNaN(gd) && !isNaN(ga) && (gd > 0 || ga > 0);
      })
      .slice(-5) // Tomamos los últimos 5 de la lista
      .reverse(); // Los mostramos del más reciente al más viejo
  }, [resultadosData]);

  return (
    <div className="animate-in space-y-6">
      
      {/* Encabezado de Bienvenida */}
      <div className="text-center py-2">
        <h1 className="font-display text-4xl sm:text-5xl text-text tracking-wide uppercase">
          ATS <span className="text-[#E8521A]">RANKING</span>
        </h1>
        <p className="text-text-muted text-xs sm:text-sm mt-1 max-w-md mx-auto">
          Plataforma oficial del torneo. Seguí los resultados, posiciones y estadísticas en tiempo real.
        </p>
      </div>

      {/* Botones de Acceso Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onTabChange('ranking')}
          className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-[#E8521A]/30 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8521A]/10 flex items-center justify-center text-[#E8521A] group-hover:scale-105 transition-transform flex-shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <div className="font-bold text-sm text-text">Ver Ranking</div>
            <div className="text-[0.65rem] text-text-muted">Tabla de posiciones oficial</div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('partidos')}
          className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-[#E8521A]/30 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8521A]/10 flex items-center justify-center text-[#E8521A] group-hover:scale-105 transition-transform flex-shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <div className="font-bold text-sm text-text">Partidos &amp; Desafíos</div>
            <div className="text-[0.65rem] text-text-muted">Historial y fechas en juego</div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('stats')}
          className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-[#E8521A]/30 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8521A]/10 flex items-center justify-center text-[#E8521A] group-hover:scale-105 transition-transform flex-shrink-0">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="font-bold text-sm text-text">Estadísticas Pro</div>
            <div className="text-[0.65rem] text-text-muted">Top 10, invictos y rachas</div>
          </div>
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL EN DOS COLUMNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Columna Izquierda: Top 10 Express */}
        <div className="glass-card rounded-2xl p-4 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-3 mb-2">
            <Trophy size={16} className="text-[#ffc107]" />
            <h3 className="font-display text-sm font-bold tracking-wider text-text uppercase">Top 10 de la Fecha</h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {top10Players.map((p: any) => {
              const photoUrl = playerPhotos[norm(p.nombre)];
              
              // CORREGIDO: Leemos de manera flexible la propiedad cat o categoria para silenciar VS Code
              const playerCat = p.cat || p.categoria || 'A';
              
              return (
                <div key={p.nombre} className="flex items-center gap-3 py-1.5 px-2 rounded-xl bg-surface-2/30">
                  <span className="rank-num text-sm font-bold text-text-muted w-5 text-center">{p.posNum}</span>
                  <PlayerAvatar nombre={p.nombre} photoUrl={photoUrl} categoria={playerCat} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-text truncate">{p.nombre}</div>
                  </div>
                  <span className={`cat-badge cat-${playerCat.toLowerCase()} text-[0.55rem]`}>{playerCat}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Últimos 5 Disputados */}
        <div className="glass-card rounded-2xl p-4 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-3 mb-2">
            <Activity size={16} className="text-[#4dff91]" />
            <h3 className="font-display text-sm font-bold tracking-wider text-text uppercase">Últimos Resultados</h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {last5Matches.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-muted">No hay partidos disputados aún.</div>
            ) : (
              last5Matches.map((m: any, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-surface-2/30 text-xs flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="truncate text-text font-medium">{m.desafiante}</div>
                    <div className="truncate text-text-subtle">{m.aceptante}</div>
                  </div>
                  <div className="text-right font-mono font-bold space-y-0.5 bg-surface-3/50 px-2 py-1 rounded-lg min-w-[32px]">
                    <div className="text-[#4dff91]">{m.games_d}</div>
                    <div className="text-text-muted">{m.games_a}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Sección de Avisos */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-text-muted px-1">
          <Megaphone size={14} className="text-[#E8521A]" />
          <span className="text-[0.65rem] font-bold tracking-widest uppercase">Comunicados Oficiales</span>
        </div>

        {avisosData && avisosData.length > 0 ? (
          <div className="space-y-3">
            {avisosData.map((aviso, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 border border-surface-3/30">
                <h4 className="font-bold text-sm text-text mb-1.5">{aviso.titulo}</h4>
                <p className="text-xs text-text-subtle leading-relaxed whitespace-pre-line">
                  {aviso.texto}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-surface-3 bg-surface-2/30 p-6 text-center text-xs text-text-muted">
            📭 Sin comunicados ni avisos activos por el momento.
          </div>
        )}
      </div>

    </div>
  );
}