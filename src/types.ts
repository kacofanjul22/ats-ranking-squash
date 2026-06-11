// ─── Data types ───────────────────────────────────────────────────────────────

export type Category = 'A' | 'B' | 'C' | 'D' | '';

export interface Player {
  pos: string;
  posNum: number;
  nombre: string;
  categoria: Category;
}

export interface RankingByFecha {
  [fecha: string]: Player[];
}

export interface Resultado {
  fecha: string;
  desafiante: string;
  aceptante: string;
  games_d: string | null;
  games_a: string | null;
  nota?: string;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  gf: number;
  gc: number;
}

export interface PlayerStatsMap {
  [nombre: string]: PlayerStats;
}

export interface JugadorData {
  nombre: string;
  categoria: string;
  fechaAlta: string;
  fechaBaja: string;
  contacto: string;
  foto: string;
}

export interface PhotosMap {
  [nombre: string]: string;
}

export interface Aviso {
  titulo: string;
  texto: string;
}

// ─── Tab names ────────────────────────────────────────────────────────────────

export type TabName = 'home' | 'ranking' | 'partidos' | 'stats' | 'avisos' | 'reglamento';

// ─── Computed stats ───────────────────────────────────────────────────────────

export interface PlayerFullStats {
  nombre: string;
  cat: Category;
  posActual: number | null;
  wins: number;
  losses: number;
  total: number;
  pct: number;
  gf: number;
  gc: number;
  dif: number;
  difPP: number;
  subida: number | null;
  rachaActual: number;
}

// ─── App state ────────────────────────────────────────────────────────────────

export interface AppData {
  rankingByFecha: RankingByFecha;
  fechaKeys: string[];
  currentFecha: string | null;
  resultadosData: Resultado[];
  playerStats: PlayerStatsMap;
  playerPhotos: PhotosMap;
  jugadoresData: JugadorData[];
  avisosData: Aviso[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}
