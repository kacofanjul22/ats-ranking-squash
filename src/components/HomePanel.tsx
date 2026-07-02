import { useMemo } from 'react';
import { Trophy, Calendar, BarChart3, Megaphone, Activity, Clock } from 'lucide-react';
import { norm } from '../lib/data';
import { PlayerAvatar } from './PlayerAvatar';

interface HomePanelProps {
  data: any; 
  onTabChange: (tab: any) => void;
}

export function HomePanel({ data, onTabChange }: HomePanelProps) {
  // Integramos el flag de loading nativo para evitar destellos de carga
  const { avisosData, rankingData, resultadosData, playerPhotos, loading = false } = data;

  // 1. Obtener el Top 10 del Ranking Actual Ordenado Correctamente
  const top10Players = useMemo(() => {
    return [...(rankingData || [])]
      .sort((a: any, b: any) => {
        const posA = a.posicion || a.posicion_actual || a.posNum || 999;
        const posB = b.posicion || b.posicion_actual || b.posNum || 999;
        return posA - posB;
      })
      .slice(0, 10);
  }, [rankingData]);

  // 2. Obtener los últimos 5 partidos disputados
  const last5Matches = useMemo(() => {
    if (!resultadosData) return [];
    return [...resultadosData]
      .filter(r => {
        const gd = r.games_d !== null ? parseInt(r.games_d) : NaN;
        const ga = r.games_a !== null ? parseInt(r.games_a) : NaN;
        return !isNaN(gd) && !isNaN(ga) && (gd > 0 || ga > 0);
      })
      .slice(-5) 
      .reverse(); 
  }, [resultadosData]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">
      
      {/* Encabezado de Bienvenida */}
      <div className="text-center py-4 relative">
        <h1 className="font-display text-4xl sm:text-5xl text-text tracking-wide uppercase">
          ATS <span className="text-[#E8521A] drop-shadow-[0_0_15px_rgba(232,82,26,0.15)]">RANKING</span>
        </h1>
        <p className="text-text-muted text-xs sm:text-sm mt-1 max-w-md mx-auto font-sans leading-relaxed">
          Plataforma oficial del torneo. Seguí los resultados, posiciones y estadísticas en tiempo real.
        </p>
      </div>

      {/* Botones de Acceso Rápido con Efecto Premium Glow */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onTabChange('ranking')}
          className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-[#E8521A]/30 hover:shadow-[0_0_20px_rgba(232,82,26,0.06)] text-left transition-all group transform hover:scale-[1.01] duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8521A]/10 border border-[#E8521A]/10 flex items-center justify-center text-[#E8521A] group-hover:scale-105 group-hover:bg-[#E8521A]/20 transition-all flex-shrink-0">
            <Trophy size={18} />
          </div>
          <div>
            <div className="font-bold text-sm text-text transition-colors group-hover:text-text">Ver Ranking</div>
            <div className="text-[0.65rem] text-text-muted mt-0.5">Tabla de posiciones oficial</div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('partidos')}
          className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-[#E8521A]/30 hover:shadow-[0_0_20px_rgba(232,82,26,0.06)] text-left transition-all group transform hover:scale-[1.01] duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8521A]/10 border border-[#E8521A]/10 flex items-center justify-center text-[#E8521A] group-hover:scale-105 group-hover:bg-[#E8521A]/20 transition-all flex-shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <div className="font-bold text-sm text-text transition-colors group-hover:text-text">Partidos &amp; Desafíos</div>
            <div className="text-[0.65rem] text-text-muted mt-0.5">Historial y fechas en juego</div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('stats')}
          className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-[#E8521A]/30 hover:shadow-[0_0_20px_rgba(232,82,26,0.06)] text-left transition-all group transform hover:scale-[1.01] duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8521A]/10 border border-[#E8521A]/10 flex items-center justify-center text-[#E8521A] group-hover:scale-105 group-hover:bg-[#E8521A]/20 transition-all flex-shrink-0">
            <BarChart3 size={18} />
          </div>
          <div>
            <div className="font-bold text-sm text-text transition-colors group-hover:text-text">Estadísticas Pro</div>
            <div className="text-[0.65rem] text-text-muted mt-0.5">Top 10, invictos y rachas</div>
          </div>
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL EN DOS COLUMNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Columna Izquierda: Top 10 Express */}
        <div className="glass-card rounded-2xl p-4 flex flex-col h-[400px] border border-surface-3/10 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-3 mb-2">
            <Trophy size={16} className="text-[#ffc107] drop-shadow-[0_0_6px_rgba(255,193,7,0.3)]" />
            <h3 className="font-display text-sm font-bold tracking-wider text-text uppercase">Top 10 de la Fecha</h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {loading ? (
              /* Skeleton Loader para filas Express */
              [...Array(5)].map((_, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 px-2 rounded-xl bg-surface-2/20 animate-pulse">
                  <div className="w-4 h-4 bg-surface-3/40 rounded flex-shrink-0 mx-0.5" />
                  <div className="w-6 h-6 rounded-full bg-surface-3/40 border border-white/5 flex-shrink-0" />
                  <div className="h-3.5 bg-surface-3/50 rounded w-1/2 flex-1" />
                  <div className="w-10 h-4 bg-surface-3/20 rounded flex-shrink-0" />
                </div>
              ))
            ) : top10Players.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-muted">Sin jugadores listados.</div>
            ) : (
              top10Players.map((p: any) => {
                const photoUrl = p.foto_url || (playerPhotos ? playerPhotos[norm(p.nombre)] : undefined);
                const playerCat = p.cat || p.categoria || 'A';
                const currentPosNum = p.posicion || p.posicion_actual || p.posNum;
                
                return (
                  <div key={p.nombre} className="flex items-center gap-3 py-1.5 px-2 rounded-xl bg-surface-2/30 border border-transparent hover:border-surface-3/50 transition-colors">
                    <span className="rank-num text-sm font-bold text-text-muted w-5 text-center font-mono">{currentPosNum}</span>
                    <PlayerAvatar nombre={p.nombre} photoUrl={photoUrl} categoria={playerCat} size="sm" />
                    <div className="flex-1 min-w-0 pl-0.5">
                      <div className="font-semibold text-xs text-text truncate tracking-wide">{p.nombre}</div>
                    </div>
                    <span className={`cat-badge cat-${playerCat.toLowerCase()} text-[0.55rem] font-mono font-bold`}>CAT {playerCat}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Últimos 5 Disputados */}
        <div className="glass-card rounded-2xl p-4 flex flex-col h-[400px] border border-surface-3/10 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-3 mb-2">
            <Activity size={16} className="text-[#4dff91] drop-shadow-[0_0_6px_rgba(77,255,145,0.3)]" />
            <h3 className="font-display text-sm font-bold tracking-wider text-text uppercase">Últimos Resultados</h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {loading ? (
              /* Skeleton Loader para últimos marcadores */
              [...Array(4)].map((_, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-surface-2/20 text-xs flex items-center justify-between gap-2 animate-pulse">
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3 bg-surface-3/50 rounded w-2/3" />
                    <div className="h-2.5 bg-surface-3/30 rounded w-1/2" />
                  </div>
                  <div className="w-8 h-8 bg-surface-3/30 rounded-lg flex-shrink-0" />
                </div>
              ))
            ) : last5Matches.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-muted font-sans">No hay partidos disputados aún en esta etapa.</div>
            ) : (
              last5Matches.map((m: any, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-surface-2/30 border border-transparent hover:border-surface-3/50 text-xs flex items-center justify-between gap-2 transition-all">
                  <div className="flex-1 min-w-0 space-y-1 pl-1">
                    <div className="truncate text-text font-semibold tracking-wide">{m.jugador_d || m.desafiante}</div>
                    <div className="truncate text-text-subtle/80">{m.jugador_a || m.aceptante}</div>
                  </div>
                  <div className="text-right font-mono font-extrabold space-y-0.5 bg-background/50 px-2.5 py-1.5 rounded-xl min-w-[36px] shadow-sm border border-white/5">
                    <div className="text-[#4dff91] leading-none drop-shadow-[0_0_4px_rgba(77,255,145,0.15)]">{m.games_d}</div>
                    <div className="text-text-muted leading-none mt-1">{m.games_a}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* SECCIÓN DE AVISOS OFICIALES */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-text-muted px-1">
          <Megaphone size={14} className="text-[#E8521A]" />
          <span className="text-[0.65rem] font-bold tracking-widest uppercase font-mono">Comunicados Oficiales</span>
        </div>

        {loading ? (
          /* Skeleton para la caja de avisos */
          <div className="glass-card rounded-2xl p-5 border border-surface-3/20 bg-surface-1/20 animate-pulse space-y-2.5">
            <div className="h-3.5 bg-surface-3/50 rounded w-1/4" />
            <div className="h-3 bg-surface-3/30 rounded w-3/4" />
            <div className="h-2.5 bg-surface-3/20 rounded w-1/2" />
          </div>
        ) : avisosData && avisosData.length > 0 ? (
          <div className="space-y-3">
            {avisosData.map((aviso: any, idx: number) => (
              <div key={idx} className="glass-card rounded-2xl p-4 sm:p-5 border border-surface-3/30 bg-gradient-to-br from-surface-1 to-transparent shadow-md transition-all">
                <h4 className="font-bold text-sm text-text mb-1.5 tracking-wide uppercase flex items-center gap-1.5">
                  <span className="text-xs">📢</span> {aviso.titulo}
                </h4>
                <p className="text-xs text-text-subtle leading-relaxed whitespace-pre-line font-sans pl-5">
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