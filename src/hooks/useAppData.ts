import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAppData() {
  const [data, setData] = useState({
    rankingData: [] as any[],
    rankingByFecha: {} as Record<string, any[]>, 
    resultadosData: [] as any[],
    fechasData: [] as any[],
    fechas: {} as Record<string, any>, 
    avisosData: [] as any[],
    playerStats: {} as Record<string, any>,   // 🌟 ENCHUFADO: Registra estadísticas de victorias/derrotas
    playerPhotos: {} as Record<string, string>, // 🌟 ENCHUFADO: Diccionario rápido de fotos de perfil
    currentFecha: '',
    loading: true,
    error: null as string | null,
    lastUpdated: new Date()
  });

  const fetchAllData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // 1. Traer Fechas y Comunicados desde Supabase
      const { data: fechas, error: errFechas } = await supabase.from('fechas').select('*').order('created_at', { ascending: true });
      const { data: avisos, error: errAvisos } = await supabase.from('avisos').select('*').order('created_at', { ascending: false });

      if (errFechas || errAvisos) throw new Error("Error al traer fechas o comunicados");

      let fechasMapeadas = fechas || [];
      if (fechasMapeadas.length === 0) {
        fechasMapeadas = [{ id: 1, nombre: 'Fecha 1', modalidad: 'desafios' }];
      }

      const fechasDict: Record<string, any> = {};
      fechasMapeadas.forEach(f => { fechasDict[f.nombre] = f; });

      const fechaActivaObj = fechasMapeadas[fechasMapeadas.length - 1];
      const activeFechaNombre = data.currentFecha || (fechaActivaObj ? fechaActivaObj.nombre : 'Fecha 1');
      
      const fechaSeleccionadaObj = fechasMapeadas.find(f => f.nombre === activeFechaNombre);
      const activeFechaId = fechaSeleccionadaObj ? fechaSeleccionadaObj.id : (fechaActivaObj ? fechaActivaObj.id : 1);

      // 2. Traer Jugadores Activos de Supabase
      const { data: jugadores, error: errJugadores } = await supabase.from('jugadores').select('*').eq('activo', true);
      if (errJugadores) throw new Error("Error al cargar la lista de jugadores");

      const jugadoresOrdenados = [...(jugadores || [])].sort((a, b) => {
        return (Number(a.posicion_actual) || 999) - (Number(b.posicion_actual) || 999);
      });

      // Mapeo veloz de fotos de perfil para los componentes visuales
      const photosDict: Record<string, string> = {};
      jugadoresOrdenados.forEach(j => {
        if (j.nombre && j.foto_url) photosDict[j.nombre.toLowerCase().trim()] = j.foto_url;
      });

      // 3. RECONSTRUCCIÓN GLOBAL DEL HISTORIAL CON ESCUDO ANTI-DUPLICADOS
      const { data: allRankingRows, error: errAllRank } = await supabase
        .from('ranking_actual')
        .select('posicion, fecha_id, fechas(nombre), jugadores(id, nombre, categoria, telefono, foto_url, posicion_actual)');

      if (errAllRank) throw new Error("Error consultando la matriz de historial de rankings");

      const rankingByFechaDict: Record<string, any[]> = {};
      const registrosVistos = new Set(); // 🛡️ Escudo protector contra filas fantasmas repetidas

      if (allRankingRows) {
        allRankingRows.forEach((row: any) => {
          const fNombre = row.fechas?.nombre;
          const jId = row.jugadores?.id;
          if (!fNombre || !jId) return;

          // Si el jugador ya fue insertado en esta misma fecha histórica, lo salteamos
          const comboKey = `${fNombre}-${jId}`;
          if (registrosVistos.has(comboKey)) return;
          registrosVistos.add(comboKey);

          if (!rankingByFechaDict[fNombre]) rankingByFechaDict[fNombre] = [];
          
          rankingByFechaDict[fNombre].push({
            id: jId,
            nombre: row.jugadores?.nombre,
            categoria: row.jugadores?.categoria,
            telefono: row.jugadores?.telefono,
            foto_url: row.jugadores?.foto_url,
            posicion: Number(row.posicion),
            posNum: Number(row.posicion), 
            posicion_actual: Number(row.jugadores?.posicion_actual) || Number(row.posicion)
          });
        });
      }

      // Ordenar internamente cada fecha por su posición numérica real
      Object.keys(rankingByFechaDict).forEach(key => {
        rankingByFechaDict[key].sort((a, b) => a.posicion - b.posicion);
      });

      // Fallback automático para las fechas en curso que no se han cerrado aún
      fechasMapeadas.forEach(f => {
        if (!rankingByFechaDict[f.nombre] || rankingByFechaDict[f.nombre].length === 0) {
          rankingByFechaDict[f.nombre] = jugadoresOrdenados.map(j => ({
            id: j.id,
            nombre: j.nombre,
            categoria: j.categoria,
            telefono: j.telefono,
            foto_url: j.foto_url,
            posicion: Number(j.posicion_actual) || 999,
            posNum: Number(j.posicion_actual) || 999,
            posicion_actual: Number(j.posicion_actual) || 999
          }));
        }
      });

      const rankingMapeado = rankingByFechaDict[activeFechaNombre] || [];

      // 4. Traer Partidos del Torneo y Mapear Compatibilidad Completa de Columnas
      const { data: partidosRows, error: errPartidos } = await supabase
        .from('partidos')
        .select(`
          id,
          games_desafiante,
          games_aceptante,
          fechas(nombre),
          desafiante:jugadores!desafiante_id(nombre),
          aceptante:jugadores!aceptante_id(nombre)
        `);

      if (errPartidos) throw errPartidos;

      // Generamos un objeto multi-propiedades para que responda bien a cualquier componente viejo o nuevo
      const partidosMapeados = (partidosRows || []).map((p: any) => ({
        id: p.id,
        fecha: p.fechas?.nombre || '',
        jugador_d: p.desafiante?.nombre || 'Desconocido',
        jugador_a: p.aceptante?.nombre || 'Desconocido',
        nombreDes: p.desafiante?.nombre || 'Desconocido', 
        nombreAce: p.aceptante?.nombre || 'Desconocido', 
        desafiante: p.desafiante?.nombre || 'Desconocido',
        aceptante: p.aceptante?.nombre || 'Desconocido',
        games_d: p.games_desafiante,
        games_a: p.games_aceptante,
        games_desafiante: p.games_desafiante,
        games_aceptante: p.games_aceptante
      }));

      // 📊 PROCESADOR AUTOMÁTICO DE ESTADÍSTICAS REALES
      const statsCalculadas: Record<string, { wins: number; losses: number; gf: number; gc: number }> = {};
      partidosMapeados.forEach((p: any) => {
        if (p.games_d === null || p.games_a === null) return; // Se ignora si no se cargaron resultados todavía
        
        const nD = p.jugador_d;
        const nA = p.jugador_a;
        const gd = Number(p.games_d);
        const ga = Number(p.games_a);

        if (!statsCalculadas[nD]) statsCalculadas[nD] = { wins: 0, losses: 0, gf: 0, gc: 0 };
        if (!statsCalculadas[nA]) statsCalculadas[nA] = { wins: 0, losses: 0, gf: 0, gc: 0 };

        statsCalculadas[nD].gf += gd;
        statsCalculadas[nD].gc += ga;
        statsCalculadas[nA].gf += ga;
        statsCalculadas[nA].gc += gd;

        if (gd === 0 && ga === 0) {
          // Regla especial de tu reglamento: Sanción mutua por partido no jugado
          statsCalculadas[nD].losses += 1;
          statsCalculadas[nA].losses += 1;
        } else if (gd > ga) {
          statsCalculadas[nD].wins += 1;
          statsCalculadas[nA].losses += 1;
        } else {
          statsCalculadas[nA].wins += 1;
          statsCalculadas[nD].losses += 1;
        }
      });

      setData({
        rankingData: rankingMapeado,
        rankingByFecha: rankingByFechaDict, 
        resultadosData: partidosMapeados,
        fechasData: fechasMapeadas,
        fechas: fechasDict, 
        playerStats: statsCalculadas, // Servido en bandeja
        playerPhotos: photosDict,     // Servido en bandeja
        avisosData: avisos || [],
        currentFecha: activeFechaNombre,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (err: any) {
      console.error("Detalle del error en la carga:", err);
      setData(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [data.currentFecha]);

  useEffect(() => {
    fetchAllData();
  }, [data.currentFecha]);

  const setCurrentFecha = (nombreFecha: string) => {
    setData(prev => ({ ...prev, currentFecha: nombreFecha }));
  };

  return {
    data,
    refresh: fetchAllData,
    fetchAll: fetchAllData,
    setCurrentFecha,
    setData
  };
}