import type { Aviso } from '../types';

interface AvisosPanelProps {
  avisos: Aviso[];
}

export function AvisosPanel({ avisos }: AvisosPanelProps) {
  if (avisos.length === 0) {
    return (
      <div className="animate-in text-center py-16 text-text-muted">
        <div className="text-4xl mb-4">📭</div>
        <div className="font-semibold text-sm">Sin avisos activos</div>
        <div className="text-xs mt-1">Los comunicados del torneo aparecerán aquí</div>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-4">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl text-text tracking-wide">AVISOS</h2>
        <div className="section-label mt-0.5">{avisos.length} comunicado{avisos.length !== 1 ? 's' : ''} activo{avisos.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="space-y-3">
        {avisos.map((a, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[rgba(232,82,26,0.25)] bg-gradient-to-br from-[rgba(232,82,26,0.08)] to-[rgba(232,82,26,0.02)] p-4 sm:p-5 flex gap-4"
          >
            <div className="text-2xl flex-shrink-0 mt-0.5">📢</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-text text-sm mb-1.5">{a.titulo}</div>
              {a.texto && (
                <div className="text-sm text-text-subtle leading-relaxed whitespace-pre-line">{a.texto}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reglamento ───────────────────────────────────────────────────────────────

export function ReglamentoPanel() {
  const reglas = [
    { num: 1,  text: 'El Ranking se publicará en los canales de difusión de la asociación.' },
    { num: 2,  text: 'Los jugadores de ranking "par" deberán desafiar al de ranking "impar" ubicado 3 puestos más arriba. El impar debe aceptarlo.' },
    { num: 3,  text: <>Si el <strong className="text-text">#par pierde</strong> baja 1 posición. Si el <strong className="text-text">#par gana</strong> sube 4 puestos. Si el <strong className="text-text">#impar pierde</strong> baja 4 posiciones y si gana sube 1.</> },
    { num: 4,  text: <>Excepciones: a) El #4 desafía al #2; el ganador desafía al #1. b) Si el último jugador es impar, desafía al ubicado 2 puestos arriba. c) Si el último es par, el penúltimo gana sin jugar.</> },
    { num: 5,  text: 'Los desafíos se coordinan y juegan en dos períodos mensuales: del día 2 al 14, y del 16 al 30/31.' },
    { num: 6,  text: 'El desafío implica la coordinación (primeros 5 días); el partido se juega dentro del período.' },
    { num: 7,  text: <>La comunicación del resultado la realiza el <strong className="text-text">par</strong> hasta el día 14 o 30/31.</> },
    { num: 8,  text: <>Los partidos se disputarán al <strong className="text-text">mejor de 5 games</strong>.</> },
    { num: 9,  text: <>El ranking va de <strong className="text-text">abril al 15 de noviembre</strong>. Al finalizar se realiza el Torneo Master de fin de año.</> },
    { num: 10, text: <>Se cobra <strong className="text-text">$20.000</strong> el primer mes (abril) y <strong className="text-text">$12.000</strong> los meses posteriores.</> },
    { num: 11, text: <>Se aplica <strong className="text-text">W.O.</strong> pasados 15 minutos de la hora fijada.</> },
    { num: 12, text: <>El ranking está separado en <strong className="text-text">4 categorías: A, B, C y D</strong>.</> },
    { num: 13, text: 'La organización se reserva el derecho de ubicar a nuevos jugadores en la categoría o posición que considere pertinente.' },
  ];

  return (
    <div className="animate-in space-y-6">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl text-text tracking-wide">
          REGLA<span className="text-[#E8521A]">MENTO</span>
        </h2>
        <div className="section-label mt-0.5">Temporada 2026 · Asociación Tucumana de Squash</div>
      </div>

      <div className="glass-card rounded-2xl p-5 sm:p-7 space-y-4">
        {reglas.map(r => (
          <div key={r.num} className="flex gap-4 pb-4 border-b border-surface-3 last:border-0 last:pb-0">
            <div className="rank-num text-2xl text-[rgba(232,82,26,0.4)] flex-shrink-0 w-7 text-right">{r.num}</div>
            <p className="text-sm text-text-subtle leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
