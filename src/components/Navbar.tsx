import { useState } from 'react';
import { Menu, X, RefreshCw } from 'lucide-react';
import type { TabName } from '../types';

interface NavbarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
  avisosCount: number;
  pendientesCount: number;
}

const tabs: { key: TabName; label: string }[] = [
  { key: 'home',      label: 'Inicio'     },
  { key: 'ranking',   label: 'Ranking'    },
  { key: 'partidos',  label: 'Partidos'   },
  { key: 'stats',     label: 'Stats'      },
  { key: 'avisos',    label: 'Avisos'     },
  { key: 'reglamento',label: 'Reglamento' },
];

export function Navbar({ activeTab, onTabChange, lastUpdated, loading, onRefresh, avisosCount, pendientesCount }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const syncText = loading
    ? 'Sincronizando…'
    : lastUpdated
    ? `${lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Sin conexión';

  const badgeFor = (key: TabName) => {
    if (key === 'avisos' && avisosCount > 0) return avisosCount;
    if (key === 'partidos' && pendientesCount > 0) return pendientesCount;
    return null;
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-surface-1/90 backdrop-blur-md border-b border-surface-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-24">
          {/* Logo */}
          <button
            onClick={() => { onTabChange('home'); setMenuOpen(false); }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="Logo ATS" className="h-16 w-auto object-contain py-1" />
            <div className="leading-tight">
              <div className="font-display text-[1.4rem] tracking-wide text-text">
                RANKING <span className="text-[#E8521A]">2026</span>
              </div>
              <div className="text-[0.58rem] text-text-muted tracking-[0.22em] uppercase font-mono">
                Asoc. Tucumana de Squash
              </div>
            </div>
          </button>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`relative px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors rounded-md ${
                  activeTab === t.key
                    ? 'text-[#E8521A] bg-[rgba(232,82,26,0.1)]'
                    : 'text-text-muted hover:text-text-subtle hover:bg-surface-2'
                }`}
              >
                {t.label}
                {badgeFor(t.key) && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#E8521A] text-white text-[0.55rem] font-bold rounded-full flex items-center justify-center px-1">
                    {badgeFor(t.key)}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Sync status */}
            <div className="hidden sm:flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  loading ? 'bg-[#f5a623] animate-pulse' : lastUpdated ? 'bg-[#4dff91] animate-[pulseDot_3s_ease-in-out_infinite]' : 'bg-text-muted'
                }`}
              />
              <span className="text-[0.65rem] text-text-muted font-mono">{syncText}</span>
              <button
                onClick={onRefresh}
                className={`text-text-muted hover:text-text-subtle transition-colors ${loading ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-text-muted hover:text-text p-1 rounded-md hover:bg-surface-2 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Tab strip (desktop) ── */}
        <div className="hidden md:block border-t border-surface-3">
          {/* Just the active indicator line */}
        </div>
      </header>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <nav
            className="absolute top-14 left-0 right-0 bg-surface-1 border-b border-surface-3 py-2"
            onClick={e => e.stopPropagation()}
          >
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => { onTabChange(t.key); setMenuOpen(false); }}
                className={`w-full text-left flex items-center justify-between px-6 py-3 text-sm font-semibold tracking-wider uppercase transition-colors ${
                  activeTab === t.key
                    ? 'text-[#E8521A] bg-[rgba(232,82,26,0.08)]'
                    : 'text-text-subtle hover:text-text hover:bg-surface-2'
                }`}
              >
                <span>{t.label}</span>
                {badgeFor(t.key) && (
                  <span className="min-w-[20px] h-5 bg-[#E8521A] text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center px-1.5">
                    {badgeFor(t.key)}
                  </span>
                )}
              </button>
            ))}

            {/* Sync in mobile menu */}
            <div className="px-6 py-3 border-t border-surface-3 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-[#f5a623] animate-pulse' : 'bg-[#4dff91]'}`} />
              <span className="text-[0.65rem] text-text-muted font-mono">{syncText}</span>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
