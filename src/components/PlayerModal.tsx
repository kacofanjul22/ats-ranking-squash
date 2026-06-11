import { useEffect, useRef, useCallback } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { norm } from '../lib/data';
import type { AppData } from '../types';

interface PlayerModalProps {
  nombre: string | null;
  data: AppData;
  onClose: () => void;
}

function drawHistoryChart(
  canvas: HTMLCanvasElement,
  histData: Array<{ fecha: string; pos: number | null }>,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.parentElement?.clientWidth || 540;
  const H = 200;
  canvas.width = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const valid = histData.filter(d => d.pos !== null);
  if (valid.length < 2) {
    ctx.fillStyle = '#555';
    ctx.font = '13px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Datos insuficientes', W / 2, H / 2);
    return;
  }

  const pad = { top: 24, right: 16, bottom: 32, left: 36 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const vals = histData.map(d => d.pos);
  const labels = histData.map(d => d.fecha);
  const validVals = vals.filter((v): v is number => v !== null);
  const margin = Math.max(2, Math.ceil((Math.max(...validVals) - Math.min(...validVals)) * 0.25) || 2);
  const domMin = Math.max(1, Math.min(...validVals) - margin);
  const domMax = Math.max(...validVals) + margin;
  const xScale = (i: number) => pad.left + (i / ((labels.length - 1) || 1)) * cW;
  const yScale = (v: number) => pad.top + ((v - domMin) / ((domMax - domMin) || 1)) * cH;

  // Grid lines
  ctx.strokeStyle = '#242424';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#555';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'right';
  for (let g = 0; g <= 4; g++) {
    const posLabel = Math.round(domMin + (g / 4) * (domMax - domMin));
    const y = yScale(posLabel);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke();
    ctx.fillText(`#${posLabel}`, pad.left - 4, y + 3);
  }

  // X axis labels
  ctx.textAlign = 'center';
  labels.forEach((lbl, i) => {
    const x = xScale(i);
    ctx.fillStyle = '#444';
    const short = lbl.length > 8 ? lbl.slice(-4) : lbl;
    ctx.fillText(short, x, H - 6);
  });

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
  grad.addColorStop(0, 'rgba(232,82,26,0.25)');
  grad.addColorStop(1, 'rgba(232,82,26,0)');

  ctx.beginPath();
  let started = false;
  labels.forEach((_, i) => {
    const v = vals[i];
    if (v === null) return;
    const x = xScale(i), y = yScale(v);
    if (!started) { ctx.moveTo(x, y); started = true; }
    else ctx.lineTo(x, y);
  });
  const lastValid = [...vals].reverse().find(v => v !== null);
  const firstValid = vals.find(v => v !== null);
  if (lastValid !== undefined && firstValid !== undefined) {
    const lastX = xScale(vals.lastIndexOf(lastValid));
    const firstX = xScale(vals.indexOf(firstValid));
    ctx.lineTo(lastX, pad.top + cH);
    ctx.lineTo(firstX, pad.top + cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Main line
  ctx.beginPath();
  started = false;
  labels.forEach((_, i) => {
    const v = vals[i];
    if (v === null) return;
    const x = xScale(i), y = yScale(v);
    if (!started) { ctx.moveTo(x, y); started = true; }
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#E8521A';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots
  labels.forEach((_, i) => {
    const v = vals[i];
    if (v === null) return;
    const x = xScale(i), y = yScale(v);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#E8521A';
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tooltip label
    ctx.fillStyle = '#f0ebe5';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`#${v}`, x, y - 8);
  });
}

export function PlayerModal({ nombre, data, onClose }: PlayerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { rankingByFecha, fechaKeys, currentFecha, playerStats, playerPhotos, jugadoresData, resultadosData } = data;

  const players = currentFecha ? (rankingByFecha[currentFecha] || []) : [];
  const player = nombre ? players.find(p => norm(p.nombre) === norm(nombre)) : null;

  const photoUrl = nombre ? playerPhotos[norm(nombre)] : undefined;
  const jData = nombre ? jugadoresData.find(j => norm(j.nombre) === norm(nombre)) : null;
  const key = nombre ? Object.keys(playerStats).find(k => norm(k) === norm(nombre)) : null;
  const st = key ? playerStats[key] : null;

  const wins   = st?.wins   ?? 0;
  const losses = st?.losses ?? 0;
  const gf     = st?.gf     ?? 0;
  const gc     = st?.gc     ?? 0;
  const dif    = gf - gc;

  const histData = fechaKeys.map(fk => {
    const found = (rankingByFecha[fk] || []).find(p => norm(p.nombre) === norm(nombre || ''));
    return { fecha: fk, pos: found ? found.posNum : null };
  });

  const myMatches = nombre
    ? resultadosData.filter(m => norm(m.desafiante) === norm(nombre) || norm(m.aceptante) === norm(nombre))
    : [];

  const drawChart = useCallback(() => {
    if (canvasRef.current && nombre) drawHistoryChart(canvasRef.current, histData);
  }, [nombre, histData]);

  useEffect(() => {
    if (nombre) {
      setTimeout(drawChart, 50);
    }
  }, [nombre, drawChart]);

  useEffect(() => {
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  if (!nombre) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200 ${
        nombre ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 no-scrollbar"
        style={{ animation: 'scaleIn 0.2s ease both' }}
      >
        {/* ── Modal header ── */}
        <div className="flex items-center gap-3 mb-5">
          <PlayerAvatar nombre={nombre} photoUrl={photoUrl} categoria={player?.categoria} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-text tracking-wide leading-tight">{nombre}</h2>
            <div className="text-xs text-text-muted mt-0.5">
              {player?.categoria ? `Categoría ${player.categoria} · ` : ''}
              Pos. #{player?.pos || '—'}
            </div>
            {jData?.contacto && (
              <a
                href={`https://wa.me/${jData.contacto.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1.5 text-[0.7rem] font-semibold text-[#25d366] bg-[rgba(37,211,102,0.1)] border border-[rgba(37,211,102,0.25)] px-2.5 py-1 rounded-lg hover:bg-[rgba(37,211,102,0.18)] transition-colors"
              >
                <MessageCircle size={11} />
                WhatsApp
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-4 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { val: `#${player?.pos || '—'}`, label: 'Posición',   color: 'text-[#E8521A]' },
            { val: `${wins}/${losses}`, label: 'G / P',    color: 'text-text'      },
            { val: `${dif >= 0 ? '+' : ''}${dif}`, label: 'Dif. games', color: dif >= 0 ? 'text-[#E8521A]' : 'text-[#ff5c5c]' },
          ].map(s => (
            <div key={s.label} className="bg-surface-2 rounded-xl p-3 text-center border border-surface-3">
              <div className={`stat-value text-2xl ${s.color}`}>{s.val}</div>
              <div className="text-[0.6rem] text-text-muted tracking-wider uppercase mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── History chart ── */}
        <div className="mb-5">
          <div className="text-[0.6rem] text-text-muted tracking-widest uppercase mb-2 font-bold">Evolución de posición — #1 es la cima</div>
          <div className="bg-surface-2 rounded-xl p-3 border border-surface-3">
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
          </div>
        </div>

        {/* ── Match history ── */}
        <div>
          <div className="text-[0.6rem] text-text-muted tracking-widest uppercase mb-2 font-bold">Partidos jugados</div>
          {myMatches.length === 0 ? (
            <div className="text-center py-4 text-text-muted text-sm">Sin partidos registrados</div>
          ) : (
            <div className="space-y-1">
              {myMatches.map((m, i) => {
                const isD = norm(m.desafiante) === norm(nombre);
                const opp = isD ? m.aceptante : m.desafiante;
                const gd = m.games_d !== null ? parseInt(m.games_d) : null;
                const ga = m.games_a !== null ? parseInt(m.games_a) : null;
                const hasScore = gd !== null && ga !== null && (gd > 0 || ga > 0);
                const myG = isD ? gd : ga;
                const oppG = isD ? ga : gd;
                const won = hasScore && myG !== null && oppG !== null && myG > oppG;
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-surface-3 last:border-0 text-sm">
                    <span className="text-[0.6rem] text-text-muted font-mono min-w-[48px] flex-shrink-0">F. {m.fecha}</span>
                    <span className="flex-1 text-text-subtle truncate">{opp || '—'}</span>
                    {hasScore && myG !== null && oppG !== null && (
                      <span className={`font-bold text-sm flex-shrink-0 ${won ? 'text-[#4dff91]' : 'text-[#ff5c5c]'}`}>
                        {myG}–{oppG}
                      </span>
                    )}
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${
                      hasScore
                        ? won ? 'badge-win' : 'badge-loss'
                        : 'badge-pending'
                    }`}>
                      {hasScore ? (won ? 'Ganó' : 'Perdió') : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
