import { useState, useMemo, useEffect } from 'react';
import { useAppData } from './hooks/useAppData';
import { Navbar } from './components/Navbar';
import { HomePanel } from './components/HomePanel';
import { RankingPanel } from './components/RankingPanel';
import { PartidosPanel } from './components/PartidosPanel';
import { StatsPanel } from './components/StatsPanel';
import { InstallPrompt } from './components/InstallPrompt';
import { PlayerModal } from './components/PlayerModal'; 
import { norm } from './lib/data';
import type { TabName } from './types';

// ── 📣 COMPONENTE INLINE: AVISOS OFICIALES ──
// Lo definimos aquí para evitar el "Crash de pantalla negra" del componente original
function AvisosPanel({ avisos }: { avisos: any[] }) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-surface-3/30 animate-in space-y-4">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-text tracking-wide uppercase">
          Comunicados <span className="text-[#E8521A]">📣</span>
        </h2>
        <div className="text-[0.65rem] font-bold tracking-widest uppercase text-text-muted mt-0.5">
          Novedades y avisos de la organización
        </div>
      </div>
      <div className="space-y-3">
        {avisos && avisos.length > 0 ? (
          avisos.map((aviso: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-surface-2/40 border border-surface-3/20">
              <h4 className="font-bold text-sm text-text mb-1.5">{aviso.titulo}</h4>
              <p className="text-xs text-text-subtle leading-relaxed whitespace-pre-line">
                {aviso.texto}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-surface-3 bg-surface-2/30 p-8 text-center text-xs text-text-muted">
            📭 No hay comunicados activos en este momento.
          </div>
        )}
      </div>
    </div>
  );
}

// ── 📋 COMPONENTE INLINE: REGLAMENTO OFICIAL 2026 ──
function ReglamentoPanel() {
  // Aquí cargamos exactamente tus 13 reglas oficiales
  const reglas = [
    "El Ranking se publicará en los canales de difusión de la asociación.",
    "Los jugadores de ranking \"par\" deberán desafiar al de ranking \"impar\" ubicado 3 puestos más arriba. El impar debe aceptarlo.",
    "Si el #par pierde baja 1 posición. Si el #par gana sube 4 puestos. Si el #impar pierde baja 4 posiciones y si gana sube 1.",
    "Excepciones: a) El #4 desafía al #2; el ganador desafía al #1. b) Si el último jugador es impar, desafía al ubicado 2 puestos arriba. c) Si el último es par, el penúltimo gana sin jugar.",
    "Los desafíos se coordinan y juegan en dos períodos mensuales: del día 2 al 14, y del 16 al 30/31.",
    "El desafío implica la coordinación (primeros 5 días); el partido se juega dentro del período.",
    "La comunicación del resultado la realiza el par hasta el día 14 o 30/31.",
    "Los partidos se disputarán al mejor de 5 games.",
    "El ranking va de abril al 15 de noviembre. Al finalizar se realiza el Torneo Master de fin de año.",
    "Se cobra $20.000 el primer mes (abril) y $12.000 los meses posteriores.",
    "Se aplica W.O. pasados 15 minutos de la hora fijada.",
    "El ranking está separado en 4 categorías: A, B, C y D.",
    "La organización se reserva el derecho de ubicar a nuevos jugadores en la categoría o posición que considere pertinente."
  ];

  return (
    <div className="glass-card rounded-2xl p-5 border border-surface-3/30 animate-in space-y-4">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-text tracking-wide uppercase">
          Reglamento <span className="text-[#E8521A]">📋</span>
        </h2>
        <div className="text-[0.65rem] font-bold tracking-widest uppercase text-text-muted mt-0.5">
          Temporada 2026 · Asociación Tucumana de Squash
        </div>
      </div>
      
      <div className="space-y-3.5 text-xs text-text-subtle leading-relaxed max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
        {reglas.map((regla, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-surface-2/40 border border-surface-3/20 flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E8521A]/10 text-[#E8521A] flex items-center justify-center font-bold text-[0.65rem] mt-0.5">
              {idx + 1}
            </span>
            <p className="pt-1">{regla}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { data, refresh, fetchAll, setData, setCurrentFecha, setSelectedFecha } = useAppData() as any;
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // ── 📱 NAVEGACIÓN INTELIGENTE: CONTROL DEL BOTÓN ATRÁS ──
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ tab: 'home' }, '', '');
    }
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.history.state?.tab !== tab) {
      window.history.pushState({ tab }, '', '');
    }
  };

  // ── 📊 CÁLCULO DE PROPIEDADES PARA LA NAVBAR ──
  const avisosCount = data.avisosData?.length || 0;

  const pendientesCount = useMemo(() => {
    if (!data.resultadosData || !data.currentFecha) return 0;
    return data.resultadosData.filter((r: any) => {
      const mismaFecha = norm(r.fecha) === norm(data.currentFecha);
      const gd = r.games_d !== null ? parseInt(r.games_d) : NaN;
      const ga = r.games_a !== null ? parseInt(r.games_a) : NaN;
      const jugado = !isNaN(gd) && !isNaN(ga) && (gd > 0 || ga > 0);
      return mismaFecha && !jugado;
    }).length;
  }, [data.resultadosData, data.currentFecha]);

  const handleRefresh = refresh || fetchAll || (() => window.location.reload());

  // ── Pantalla de carga ──
  if (data.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E8521A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted text-xs font-medium tracking-wider uppercase font-mono">
            Sincronizando planilla oficial...
          </p>
        </div>
      </div>
    );
  }

  // ── Pantalla de error ──
  if (data.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 max-w-sm text-center border border-red-500/20">
          <div className="text-2xl mb-2">⚠️</div>
          <h3 className="font-bold text-text text-sm">Error al conectar con Google Sheets</h3>
          <p className="text-xs text-text-muted mt-1">{data.error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-[#E8521A] text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-[#ff6b36] transition-colors w-full"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col pb-20 sm:pb-0">
      
      <Navbar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        loading={data.loading}
        lastUpdated={data.lastUpdated}
        onRefresh={handleRefresh}
        avisosCount={avisosCount}
        pendientesCount={pendientesCount}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8">
        
        {activeTab === 'home' && (
          <HomePanel data={data} onTabChange={handleTabChange} />
        )}
        
        {activeTab === 'ranking' && (
          <RankingPanel 
            data={data} 
            onPlayerClick={(player) => setSelectedPlayer(player)} 
            onFechaChange={(val: any) => {
              const nuevaFecha = typeof val === 'string' ? val : val?.target?.value || val?.fecha || val;
              if (!nuevaFecha || typeof nuevaFecha !== 'string') return;

              if (typeof setCurrentFecha === 'function') setCurrentFecha(nuevaFecha);
              else if (typeof setSelectedFecha === 'function') setSelectedFecha(nuevaFecha);
              else if (typeof setData === 'function') {
                setData((prev: any) => ({ ...prev, currentFecha: nuevaFecha }));
              }
            }} 
          />
        )}
        
        {activeTab === 'partidos' && (
          <PartidosPanel data={data} />
        )}
        
        {activeTab === 'stats' && (
          <StatsPanel data={data} />
        )}

        {/* ── SECCIONES SANADAS E INTEGRADAS ── */}
        {activeTab === 'avisos' && (
          <AvisosPanel avisos={data.avisosData} />
        )}
        
        {activeTab === 'reglamento' && (
          <ReglamentoPanel />
        )}

        {/* Pop-up inteligente de instalación PWA */}
        <InstallPrompt />

        {selectedPlayer && (
          <PlayerModal 
            {...({ 
              player: selectedPlayer,
              jugador: selectedPlayer,
              nombre: typeof selectedPlayer === 'string' ? selectedPlayer : selectedPlayer?.nombre,
              data, 
              onClose: () => setSelectedPlayer(null),
              cerrar: () => setSelectedPlayer(null)
            } as any)} 
          />
        )}
        
      </main>
    </div>
  );
}