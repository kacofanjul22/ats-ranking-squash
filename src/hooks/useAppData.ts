import { useState, useEffect, useCallback } from 'react';
import type { AppData } from '../types';
import {
  loadRanking,
  loadResultados,
  loadJugadores,
  loadAvisos,
} from '../lib/data';

const INITIAL: AppData = {
  rankingByFecha: {},
  fechaKeys: [],
  currentFecha: null,
  resultadosData: [],
  playerStats: {},
  playerPhotos: {},
  jugadoresData: [],
  avisosData: [],
  loading: true,
  error: null,
  lastUpdated: null,
};

export function useAppData() {
  const [data, setData] = useState<AppData>(INITIAL);

  const fetchAll = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [ranking, resultados, jugadores, avisos] = await Promise.all([
        loadRanking(),
        loadResultados(),
        loadJugadores(),
        loadAvisos(),
      ]);

      // Modificamos para usar (prev => ...) y poder rescatar la fecha seleccionada
      setData(prev => ({
        rankingByFecha: ranking.rankingByFecha,
        fechaKeys: ranking.fechaKeys,
        currentFecha: prev.currentFecha || ranking.currentFecha, // <--- Si el usuario ya eligió una fecha, la conserva
        resultadosData: resultados.resultadosData,
        playerStats: resultados.playerStats,
        playerPhotos: jugadores.playerPhotos,
        jugadoresData: jugadores.jugadoresData,
        avisosData: avisos,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }));
    } catch (e) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: (e as Error).message,
      }));
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const setCurrentFecha = useCallback((fecha: string) => {
    setData(prev => ({ ...prev, currentFecha: fecha }));
  }, []);

  return { data, setCurrentFecha, refresh: fetchAll };
}
