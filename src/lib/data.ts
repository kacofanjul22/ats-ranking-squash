import type {
  RankingByFecha,
  Resultado,
  PlayerStatsMap,
  JugadorData,
  PhotosMap,
  Aviso,
} from '../types';

// ─── CSV Config ───────────────────────────────────────────────────────────────

const BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRgJZBlL0j97a5N6k-9QzHZoAexu61_Ti73MVgIHptaLHE4YgwXFT1iW5f01XAofbI9elMnCpAT3Slj';

export const CSV_RANKING    = `${BASE}/pub?gid=1935327508&single=true&output=csv`;
export const CSV_RESULTADOS = `${BASE}/pub?gid=0&single=true&output=csv`;
export const CSV_JUGADORES  = `${BASE}/pub?gid=1109244112&single=true&output=csv`;
export const CSV_AVISOS     = `${BASE}/pub?gid=1451806801&single=true&output=csv`;

export const TOP8 = 8;

// ─── Normalizer ───────────────────────────────────────────────────────────────

export function norm(n: string): string {
  return (n || '').toLowerCase().trim();
}

// ─── CSV Parser (robust — handles quoted cells with newlines) ─────────────────

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let col = '', row: string[] = [], inQ = false, i = 0;
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  while (i < text.length) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i + 1] === '"') { col += '"'; i += 2; continue; }
      inQ = !inQ; i++; continue;
    }
    if (c === ',' && !inQ) { row.push(col.trim()); col = ''; i++; continue; }
    if (c === '\n' && !inQ) { row.push(col.trim()); rows.push(row); row = []; col = ''; i++; continue; }
    col += c; i++;
  }
  row.push(col.trim());
  if (row.some(x => x !== '')) rows.push(row);
  return rows;
}

export async function fetchCSV(url: string): Promise<string[][]> {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return parseCSV(await r.text());
}

// ─── Drive thumbnail ──────────────────────────────────────────────────────────

export function toDriveImg(url: string): string {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w150` : url;
}

// ─── Load Ranking ─────────────────────────────────────────────────────────────

export async function loadRanking(): Promise<{ rankingByFecha: RankingByFecha; fechaKeys: string[]; currentFecha: string }> {
  const rows = await fetchCSV(CSV_RANKING);
  if (rows.length < 3) throw new Error('Planilla vacía');

  const h1 = rows[0], h2 = rows[1], data = rows.slice(2);
  const rankingByFecha: RankingByFecha = {};
  const fechaKeys: string[] = [];

  let col = 0;
  while (col < h1.length) {
    const label = (h1[col] || '').toString().trim();
    if (!label) { col++; continue; }
    let end = col + 1;
    while (end < h1.length && !(h1[end] || '').toString().trim()) end++;

    let po = 0, no = 1, co = 2;
    for (let c = col; c < end; c++) {
      const h = (h2[c] || '').toString().toUpperCase().trim();
      if (h.includes('POS') || h === '#') po = c - col;
      else if (h.includes('NOM') || h.includes('JUGAD')) no = c - col;
      else if (h.includes('CAT') || h.includes('GRUP')) co = c - col;
    }

    const players = [];
    for (const row of data) {
      const nombre = (row[col + no] || '').toString().trim();
      const pos = (row[col + po] || '').toString().trim();
      if (!nombre) continue;
      const cat = (row[col + co] || '').toString().trim().toUpperCase();
      players.push({
        pos,
        posNum: parseInt(pos) || 0,
        nombre,
        categoria: (['A', 'B', 'C', 'D'].includes(cat) ? cat : '') as import('../types').Category,
      });
    }

    if (players.length) { rankingByFecha[label] = players; fechaKeys.push(label); }
    col = end;
  }

  if (!fechaKeys.length) throw new Error('Sin fechas');
  const currentFecha = fechaKeys[fechaKeys.length - 1];
  return { rankingByFecha, fechaKeys, currentFecha };
}

// ─── Load Resultados ──────────────────────────────────────────────────────────

export async function loadResultados(): Promise<{ resultadosData: Resultado[]; playerStats: PlayerStatsMap }> {
  const rows = await fetchCSV(CSV_RESULTADOS);
  const resultadosData: Resultado[] = [];
  const playerStats: PlayerStatsMap = {};

  rows.forEach((row, i) => {
    if (i === 0) return;
    const fecha = (row[0] || '').toString().trim();
    if (!fecha) return;
    const des = (row[1] || '').toString().trim();
    const ace = (row[2] || '').toString().trim();
    const gd = row[3] !== undefined && row[3] !== '' ? row[3].toString().trim() : null;
    const ga = row[4] !== undefined && row[4] !== '' ? row[4].toString().trim() : null;
    
    // 1. NUEVO: Leemos la sexta columna (F) para capturar si dice "1er Puesto"
    const nota = row[5] !== undefined && row[5] !== '' ? row[5].toString().trim() : '';

    // 2. ACTUALIZADO: Le pasamos la nota al objeto que va a la pantalla
    resultadosData.push({ fecha, desafiante: des, aceptante: ace, games_d: gd, games_a: ga, nota });

    const gdn = gd !== null ? parseInt(gd) : NaN;
    const gan = ga !== null ? parseInt(ga) : NaN;

    if (!isNaN(gdn) && !isNaN(gan) && (gdn > 0 || gan > 0)) {
      if (des) {
        if (!playerStats[des]) playerStats[des] = { wins: 0, losses: 0, gf: 0, gc: 0 };
        gdn > gan ? playerStats[des].wins++ : playerStats[des].losses++;
        playerStats[des].gf += gdn;
        playerStats[des].gc += gan;
      }
      if (ace) {
        if (!playerStats[ace]) playerStats[ace] = { wins: 0, losses: 0, gf: 0, gc: 0 };
        gan > gdn ? playerStats[ace].wins++ : playerStats[ace].losses++;
        playerStats[ace].gf += gan;
        playerStats[ace].gc += gdn;
      }
    }
  });

  return { resultadosData, playerStats };
}

// ─── Load Jugadores ───────────────────────────────────────────────────────────

export async function loadJugadores(): Promise<{ jugadoresData: JugadorData[]; playerPhotos: PhotosMap }> {
  const jugadoresData: JugadorData[] = [];
  const playerPhotos: PhotosMap = {};

  try {
    const rows = await fetchCSV(CSV_JUGADORES);
    if (rows.length < 2) return { jugadoresData, playerPhotos };

    const h = rows[0].map(x => (x || '').toString().toUpperCase().trim());
    const ci = (k: string) => h.findIndex(x => x.includes(k));

    const iNom  = ci('NOM') >= 0 ? ci('NOM') : 0;
    const iCat  = ci('CAT') >= 0 ? ci('CAT') : 1;
    const iAlta = ci('ALTA') >= 0 ? ci('ALTA') : 2;
    const iBaja = ci('BAJA') >= 0 ? ci('BAJA') : 3;
    const iWA   = ci('CONT') >= 0 ? ci('CONT') : ci('WA') >= 0 ? ci('WA') : 4;
    const iFoto = ci('FOTO') >= 0 ? ci('FOTO') : ci('URL') >= 0 ? ci('URL') : 5;

    rows.forEach((row, i) => {
      if (i === 0) return;
      const nombre = (row[iNom] || '').toString().trim();
      if (!nombre) return;
      const url = (row[iFoto] || '').toString().trim();
      const fotoUrl = url.startsWith('http') ? toDriveImg(url) : '';
      if (fotoUrl) playerPhotos[norm(nombre)] = fotoUrl;
      jugadoresData.push({
        nombre,
        categoria: (row[iCat] || '').toString().trim().toUpperCase(),
        fechaAlta: (row[iAlta] || '').toString().trim(),
        fechaBaja: (row[iBaja] || '').toString().trim(),
        contacto: (row[iWA] || '').toString().trim(),
        foto: fotoUrl,
      });
    });
  } catch (e) {
    console.warn('Jugadores:', (e as Error).message);
  }

  return { jugadoresData, playerPhotos };
}

// ─── Load Avisos ──────────────────────────────────────────────────────────────

export async function loadAvisos(): Promise<Aviso[]> {
  const avisosData: Aviso[] = [];
  try {
    const rows = await fetchCSV(CSV_AVISOS);
    if (rows.length < 2) return avisosData;

    const h = rows[0].map(x => (x || '').toString().toUpperCase().trim());
    const ci = (k: string) => h.findIndex(x => x.includes(k));

    const iTit = ci('TIT') >= 0 ? ci('TIT') : 1;
    const iTxt = ci('TXT') >= 0 ? ci('TXT') : ci('TEXT') >= 0 ? ci('TEXT') : 2;
    const iAct = ci('ACT') >= 0 ? ci('ACT') : 3;

    rows.forEach((row, i) => {
      if (i === 0) return;
      const titulo = (row[iTit] || '').toString().trim();
      if (!titulo) return;
      const activo = (row[iAct] || '').toString().trim().toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const esActivo = ['SI', 'S', 'YES', 'Y', '1', 'TRUE', 'VERDADERO'].includes(activo);
      if (!esActivo) return;
      avisosData.push({ titulo, texto: (row[iTxt] || '').toString().trim() });
    });

    avisosData.reverse();
  } catch (e) {
    console.warn('Avisos:', (e as Error).message);
  }

  return avisosData;
}

// ─── Build position map ───────────────────────────────────────────────────────

export function buildPosMap(players: import('../types').Player[] | null | undefined): Record<string, number> {
  if (!players) return {};
  const m: Record<string, number> = {};
  players.forEach(p => { if (p.nombre) m[norm(p.nombre)] = p.posNum || 0; });
  return m;
}

// ─── Compute full stats per player ───────────────────────────────────────────

export function computeFullStats(
  players: import('../types').Player[],
  firstPlayers: import('../types').Player[],
  playerStats: PlayerStatsMap,
  resultadosData: Resultado[],
): import('../types').PlayerFullStats[] {
  const firstMap = buildPosMap(firstPlayers);
  const posMap: Record<string, number> = {};
  players.forEach(p => { if (p.nombre) posMap[norm(p.nombre)] = p.posNum; });

  return players.map(p => {
    const key = Object.keys(playerStats).find(k => norm(k) === norm(p.nombre));
    const st = key ? playerStats[key] : null;

    const wins   = st?.wins   ?? 0;
    const losses = st?.losses ?? 0;
    const gf     = st?.gf     ?? 0;
    const gc     = st?.gc     ?? 0;
    const total  = wins + losses;
    const pct    = total > 0 ? Math.round((wins / total) * 100) : 0;
    const dif    = gf - gc;
    const difPP  = total > 0 ? Math.round(((gf - gc) / total) * 10) / 10 : 0;

    const fp = firstMap[norm(p.nombre)];
    const subida = fp !== undefined ? fp - p.posNum : null;

    // Compute current streak from resultados
    const myNorm = norm(p.nombre);
    const myMatches = resultadosData.filter(m => {
      const dNorm = norm(m.desafiante);
      const aNorm = norm(m.aceptante);
      return dNorm === myNorm || aNorm === myNorm;
    });
let rachaActual = 0;
for (let i = myMatches.length - 1; i >= 0; i--) {
  const m = myMatches[i];
  const gd = m.games_d !== null ? parseInt(m.games_d) : NaN;
  const ga = m.games_a !== null ? parseInt(m.games_a) : NaN;
  if (isNaN(gd) || isNaN(ga) || (gd === 0 && ga === 0)) break;
  const isD = norm(m.desafiante) === myNorm ||
    norm(m.desafiante).includes(myNorm) ||
    myNorm.includes(norm(m.desafiante));
  const won = isD ? gd > ga : ga > gd;
  if (rachaActual === 0) {
    rachaActual = won ? 1 : -1;
  } else if ((rachaActual > 0 && won) || (rachaActual < 0 && !won)) {
    rachaActual += won ? 1 : -1;
  } else {
    break;
  }
}

    return {
      nombre: p.nombre,
      cat: p.categoria,
      posActual: p.posNum || null,
      wins, losses, total, pct, gf, gc, dif, difPP, subida, rachaActual,
    };
  });
}

// ─── Initials helper ──────────────────────────────────────────────────────────

export function initials(nombre: string): string {
  return nombre.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
