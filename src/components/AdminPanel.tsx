import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Calendar, RefreshCw, CheckCircle, AlertTriangle, ArrowUp, ArrowDown, Save, UserPlus, Trash2, Edit2, X, Upload, Users, PlusCircle, Sparkles, ClipboardCopy } from 'lucide-react';
import { norm } from '../lib/data';

interface AdminPanelProps {
  data: any;
  onRefresh: () => Promise<void>;
}

export function AdminPanel({ data, onRefresh }: AdminPanelProps) {
  const { fechasData = [], resultadosData = [] } = data;
  
  const [fechaFiltroResultados, setFechaFiltroResultados] = useState('');
  const [partidoSeleccionado, setPartidoSeleccionado] = useState('');
  const [gamesDesafiante, setGamesDesafiante] = useState<number | ''>('');
  const [gamesAceptante, setGamesAceptante] = useState<number | ''>('');
  const [fechaACerrar, setFechaACerrar] = useState('');
  const [nombreProximaFecha, setNombreProximaFecha] = useState('');
  const [modalidad, setModalidad] = useState('Escalera'); 
  const [fechaInicioNueva, setFechaInicioNueva] = useState('');
  const [fechaFinNueva, setFechaFinNueva] = useState('');
  
  const [jugadoresLive, setJugadoresLive] = useState<any[]>([]);
  const [loadingLivePlayers, setLoadingLivePlayers] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('A');
  const [nuevoFotoFile, setNuevoFotoFile] = useState<File | null>(null);

  const [idJugadorEditando, setIdJugadorEditando] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCategoria, setEditCategoria] = useState('A');
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null);
  const [editFotoUrlActual, setEditFotoUrlActual] = useState<string | null>(null);

  const [idPartidoEditandoCruce, setIdPartidoEditandoCruce] = useState<string | null>(null);
  const [editDesafianteId, setEditDesafianteId] = useState('');
  const [editAceptanteId, setEditAceptanteId] = useState('');

  const [crearPartidoFechaId, setCrearPartidoFechaId] = useState('');
  const [crearDesafianteId, setCrearDesafianteId] = useState('');
  const [crearAceptanteId, setCrearAceptanteId] = useState('');

  // Estados Carga Masiva y Sorteo
  const [excelPasteText, setExcelPasteText] = useState('');
  const [fecha1Inicio, setFecha1Inicio] = useState('');
  const [fecha1Fin, setFecha1Fin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // CONTROL INTERNO PARA MODAL UX PRO (Reemplazo controlado de window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {}
  });

  // Temporizador para desvanecer alertas flotantes automáticamente a los 4 segundos
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const partidosDeFecha = useMemo(() => {
    if (!fechaFiltroResultados) return [];
    return resultadosData.filter((p: any) => norm(p.fecha) === norm(fechaFiltroResultados));
  }, [resultadosData, fechaFiltroResultados]);

  useEffect(() => {
    if (partidoSeleccionado) {
      const match = partidosDeFecha.find((p: any) => String(p.id) === String(partidoSeleccionado));
      if (match) {
        setGamesDesafiante(match.games_d !== null ? Number(match.games_d) : '');
        setGamesAceptante(match.games_a !== null ? Number(match.games_a) : '');
      }
    } else {
      setGamesDesafiante(''); setGamesAceptante('');
    }
  }, [partidoSeleccionado, partidosDeFecha]);

  const cargarJugadoresVivos = async () => {
    try {
      setLoadingLivePlayers(true);
      const { data: jug, error } = await supabase
        .from('jugadores')
        .select('id, nombre, categoria, posicion_actual, foto_url')
        .eq('activo', true)
        .order('posicion_actual', { ascending: true });

      if (error) throw error;
      setJugadoresLive(jug || []);
    } catch (err: any) {
      setStatus({ type: 'error', text: `Error cargando escalafón: ${err.message}` });
    } finally {
      setLoadingLivePlayers(false);
    }
  };

  useEffect(() => {
    cargarJugadoresVivos();
  }, []);

  const jugadoresAlfabetico = useMemo(() => {
    return [...jugadoresLive].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [jugadoresLive]);

  const subirFotoALaNube = async (file: File): Promise<string> => {
    const cleanName = file.name.replace(/\s+/g, '_').toLowerCase();
    const fileName = `${Date.now()}_${cleanName}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (uploadError) throw new Error(`Error en Storage: ${uploadError.message}`);
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleAggregateJugador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    try {
      setLoading(true); setStatus(null);
      let urlFinalImagen = null;
      if (nuevoFotoFile) urlFinalImagen = await subirFotoALaNube(nuevoFotoFile);

      const { data: actuales } = await supabase.from('jugadores').select('id, posicion_actual, categoria').eq('activo', true).order('posicion_actual', { ascending: true });
      const lista = actuales || [];
      let indiceInsercion = lista.length; 
      for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i].categoria === nuevaCategoria) {
          indiceInsercion = i + 1; break;
        }
      }
      const listaActualizada = [...lista];
      listaActualizada.splice(indiceInsercion, 0, { id: 'TEMP_ID' });

      const { data: insertado, error: errIns } = await supabase.from('jugadores').insert([{ nombre: nuevoNombre.trim(), categoria: nuevaCategoria, foto_url: urlFinalImagen, posicion_actual: indiceInsercion + 1, activo: true }]).select().single();
      if (errIns) throw errIns;

      for (let i = 0; i < listaActualizada.length; i++) {
        const idAActualizar = listaActualizada[i].id === 'TEMP_ID' ? insertado.id : listaActualizada[i].id;
        await supabase.from('jugadores').update({ posicion_actual: i + 1 }).eq('id', idAActualizar);
      }
      setStatus({ type: 'success', text: 'Jugador creado exitosamente.' });
      setNuevoNombre(''); setNuevoFotoFile(null);
      
      const inputElement = document.getElementById('nuevo-foto-input') as HTMLInputElement;
      if (inputElement) inputElement.value = '';

      await cargarJugadoresVivos(); await onRefresh();
    } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  const handleCargaMasivaExcel = async () => {
    if (!excelPasteText.trim()) return;
    try {
      setLoading(true); setStatus(null);
      const lineas = excelPasteText.split('\n');
      const loteInsertar: any[] = [];

      lineas.forEach(linea => {
        if (!linea.trim()) return;
        const columnas = linea.split(/\t|,/);
        const nombre = columnas[0]?.trim();
        const categoriaInput = columnas[1]?.trim().toUpperCase() || 'A';
        const telefono = columnas[2]?.trim() || null;

        if (nombre && nombre !== 'NOMBRE' && nombre !== 'POSICIÓN') {
          const catLimpia = ['A', 'B', 'C', 'D'].includes(categoriaInput) ? categoriaInput : 'A';
          loteInsertar.push({
            nombre,
            categoria: catLimpia,
            telefono,
            activo: true,
            posicion_actual: 999
          });
        }
      });

      if (loteInsertar.length === 0) throw new Error("No se encontraron registros válidos.");

      const { error } = await supabase.from('jugadores').insert(loteInsertar);
      if (error) throw error;

      const { data: todos } = await supabase.from('jugadores').select('id').eq('activo', true).order('categoria', { ascending: true }).order('nombre', { ascending: true });
      if (todos) {
        for (let i = 0; i < todos.length; i++) {
          await supabase.from('jugadores').update({ posicion_actual: i + 1 }).eq('id', todos[i].id);
        }
      }

      setStatus({ type: 'success', text: `¡Se han importado exitosamente ${loteInsertar.length} jugadores desde Excel!` });
      setExcelPasteText('');
      await cargarJugadoresVivos(); await onRefresh();
    } catch (err: any) { setStatus({ type: 'error', text: `Error de importación: ${err.message}` }); } finally { setLoading(false); }
  };

  const handleEjecutarSorteoInicial = async () => {
    if (!fecha1Inicio || !fecha1Fin) {
      setStatus({ type: 'error', text: 'Por favor definí las fechas de inicio y fin para la Fecha 1.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "🎲 Inicializar Sorteo de Doble Bombo",
      message: "Atención: Se reordenará estructuralmente la base de datos de la ATS. El Bombo Alto (Cat A y B) ocupará las primeras posiciones aleatorias y el Bombo Bajo (Cat C y D) completará la base. ¿Ejecutar algoritmo?",
      variant: 'warning',
      onConfirm: async () => {
        try {
          setLoading(true); setStatus(null);

          const { data: jugadores } = await supabase.from('jugadores').select('*').eq('activo', true);
          if (!jugadores || jugadores.length < 2) throw new Error("Se necesitan más jugadores para el sorteo.");

          const bomboAlto = jugadores.filter(j => j.categoria === 'A' || j.categoria === 'B');
          const bomboBajo = jugadores.filter(j => j.categoria === 'C' || j.categoria === 'D');

          for (let i = bomboAlto.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tempAlto = bomboAlto[i];
            bomboAlto[i] = bomboAlto[j];
            bomboAlto[j] = tempAlto;
          }

          for (let i = bomboBajo.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tempBajo = bomboBajo[i];
            bomboBajo[i] = bomboBajo[j];
            bomboBajo[j] = tempBajo;
          }

          const ordenSorteadoGlobal = [...bomboAlto, ...bomboBajo];

          for (let i = 0; i < ordenSorteadoGlobal.length; i++) {
            await supabase.from('jugadores').update({ posicion_actual: i + 1 }).eq('id', ordenSorteadoGlobal[i].id);
          }

          await supabase.from('fechas').delete().ilike('nombre', '%Fecha 1%');
          const { data: nuevaFechaRow, error: errNewF } = await supabase.from('fechas').insert([{ nombre: 'Fecha 1', modalidad: 'Escalera', activa: 'true', fecha_inicio: fecha1Inicio, fecha_fin: fecha1Fin }]).select().single();
          if (errNewF) throw errNewF;

          const h = ordenSorteadoGlobal.map((j, idx) => ({ fecha_id: nuevaFechaRow.id, jugador_id: j.id, posicion: idx + 1 }));
          await supabase.from('ranking_actual').insert(h);

          const nuevosPartidos = [];
          const posMap: Record<number, any> = {};
          ordenSorteadoGlobal.forEach((j, idx) => { posMap[idx + 1] = j; });
          const maxPos = ordenSorteadoGlobal.length;

          if (posMap[4] && posMap[2]) nuevosPartidos.push({ fecha_id: nuevaFechaRow.id, desafiante_id: posMap[4].id, aceptante_id: posMap[2].id, games_desafiante: null, games_aceptante: null });
          for (let p = 6; p <= maxPos; p += 2) {
            if (posMap[p] && posMap[p - 3]) nuevosPartidos.push({ fecha_id: nuevaFechaRow.id, desafiante_id: posMap[p].id, aceptante_id: posMap[p - 3].id, games_desafiante: null, games_aceptante: null });
          }

          if (nuevosPartidos.length > 0) await supabase.from('partidos').insert(nuevosPartidos);

          setStatus({ type: 'success', text: '¡Sorteo de doble bombo finalizado! La Fecha 1 quedó oficialmente inaugurada.' });
          setFecha1Inicio(''); setFecha1Fin('');
          await cargarJugadoresVivos(); await onRefresh();
        } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
      }
    });
  };

  const handleCargarResultado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoSeleccionado || gamesDesafiante === '' || gamesAceptante === '') return;
    try {
      setLoading(true); setStatus(null);
      const { error = null } = await supabase.from('partidos').update({ games_desafiante: Number(gamesDesafiante), games_aceptante: Number(gamesAceptante) }).eq('id', partidoSeleccionado);
      if (error) throw error;
      setStatus({ type: 'success', text: 'Marcador oficial guardado con éxito.' });
      setPartidoSeleccionado(''); await onRefresh();
    } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  const activarEdicionCruce = (partido: any) => {
    setIdPartidoEditandoCruce(partido.id);
    setEditDesafianteId(partido.desafiante_id || '');
    setEditAceptanteId(partido.aceptante_id || '');
  };

  const handleGuardarCruceManual = async (partidoId: string) => {
    if (editDesafianteId === editAceptanteId) {
      setStatus({ type: 'error', text: 'Un jugador no puede jugar contra sí mismo.' });
      return;
    }
    try {
      setLoading(true); setStatus(null);
      const { error } = await supabase.from('partidos').update({ desafiante_id: editDesafianteId, aceptante_id: editAceptanteId }).eq('id', partidoId);
      if (error) throw error;
      setIdPartidoEditandoCruce(null); setStatus({ type: 'success', text: 'Emparejamiento modificado con éxito.' });
      await onRefresh();
    } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  const handleEliminarPartidoFixture = (partidoId: string, descripcion: string) => {
    setConfirmModal({
      isOpen: true,
      title: "🗑️ Eliminar Partido de Fixture",
      message: `¿Estás seguro de que querés remover por completo el encuentro "${descripcion}"? Los casilleros se vaciarán de inmediato de las pantallas.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setLoading(true); setStatus(null);
          const { error } = await supabase.from('partidos').delete().eq('id', partidoId);
          if (error) throw error;
          setStatus({ type: 'success', text: 'Partido removido.' });
          await onRefresh();
        } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
      }
    });
  };

  const handleCrearPartidoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crearPartidoFechaId || !crearDesafianteId || !crearAceptanteId) return;
    try {
      setLoading(true); setStatus(null);
      const { error } = await supabase.from('partidos').insert([{ fecha_id: crearPartidoFechaId, desafiante_id: crearDesafianteId, aceptante_id: crearAceptanteId, games_desafiante: null, games_aceptante: null }]);
      if (error) throw error;
      setStatus({ type: 'success', text: 'Partido creado con éxito.' });
      setCrearDesafianteId(''); setCrearAceptanteId('');
      await onRefresh();
    } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  const moverJugadorLocal = (index: number, direccion: 'subir' | 'bajar') => {
    const targetIndex = direccion === 'subir' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= jugadoresLive.length) return;
    const listaNueva = [...jugadoresLive];
    const temp = listaNueva[index];
    listaNueva[index] = listaNueva[targetIndex];
    listaNueva[targetIndex] = temp;
    setJugadoresLive(listaNueva);
  };

  const handleGuardarRankingManual = () => {
    setConfirmModal({
      isOpen: true,
      title: "💾 Reordenamiento de Escalafón",
      message: "¿Confirmás las modificaciones manuales aplicadas sobre las posiciones del escalafón vivo?",
      variant: 'warning',
      onConfirm: async () => {
        try {
          setLoading(true);
          for (let i = 0; i < jugadoresLive.length; i++) {
            await supabase.from('jugadores').update({ posicion_actual: i + 1 }).eq('id', jugadoresLive[i].id);
          }
          setStatus({ type: 'success', text: 'Ranking guardado con éxito.' });
          await cargarJugadoresVivos(); await onRefresh();
        } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
      }
    });
  };

  const activarEdicion = (j: any) => {
    setIdJugadorEditando(j.id);
    setEditNombre(j.nombre);
    setEditCategoria(j.categoria || 'A');
    setEditFotoUrlActual(j.foto_url || null);
    setEditFotoFile(null);
  };

  const handleGuardarEdicionBase = async (id: string) => {
    try {
      setLoading(true); setStatus(null);
      let urlFinalImagen = editFotoUrlActual;
      if (editFotoFile) urlFinalImagen = await subirFotoALaNube(editFotoFile);

      const { error } = await supabase
        .from('jugadores')
        .update({ nombre: editNombre.trim(), categoria: editCategoria, foto_url: urlFinalImagen })
        .eq('id', id);

      if (error) throw error;
      setStatus({ type: 'success', text: 'Perfil actualizado con éxito.' });
      setIdJugadorEditando(null);
      await cargarJugadoresVivos(); await onRefresh();
    } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  const handleBajaJugador = (id: string, nombre: string) => {
    setConfirmModal({
      isOpen: true,
      title: "🚨 Suspender Jugador del Escalafón",
      message: `¿Seguro que querés dar de baja a "${nombre}"? Sus partidos históricos permanecerán intactos, pero ya no aparecerá en el ranking vivo ni se computará para los próximos fixtures automáticos.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setLoading(true); setStatus(null);
          const { error } = await supabase.from('jugadores').update({ activo: false }).eq('id', id);
          if (error) throw error;
          setStatus({ type: 'success', text: 'Jugador archivado correctamente.' });
          await cargarJugadoresVivos(); await onRefresh();
        } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
      }
    });
  };

  const handleProcesarCierre = async () => {
    if (!fechaACerrar || !nombreProximaFecha || !fechaInicioNueva || !fechaFinNueva) {
      setStatus({ type: 'error', text: 'Por favor completá el nombre y rango de fechas de la etapa.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "🎬 Congelar Historial y Cambiar de Fecha",
      message: `¿Estás completamente seguro de cerrar la etapa elegida? Este proceso congelará el ranking puro al inicio de la nueva etapa y calculará en milisegundos los nuevos cruces automáticos.`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          setLoading(true); setStatus(null);
          const fechaObj = fechasData.find((f: any) => norm(f.nombre) === norm(fechaACerrar));
          if (!fechaObj) throw new Error("No se encontró la fecha de origen.");
          const fechaActualId = fechaObj.id;

          const { data: nuevaFechaRow, error: errNewF } = await supabase.from('fechas').insert([{ nombre: nombreProximaFecha, modalidad: modalidad, activa: 'true', fecha_inicio: fechaInicioNueva, fecha_fin: fechaFinNueva }]).select().single();
          if (errNewF) throw errNewF;
          await supabase.from('fechas').update({ activa: 'FALSE' }).eq('id', fechaActualId);

          const { data: jugadores } = await supabase.from('jugadores').select('id, posicion_actual').eq('activo', true);
          if (jugadores) {
            const h = jugadores.map(j => ({ fecha_id: nuevaFechaRow.id, jugador_id: j.id, posicion: Number(j.posicion_actual) }));
            await supabase.from('ranking_actual').insert(h);
          }

          const { data: jugadoresRecalculados } = await supabase.from('jugadores').select('id, posicion_actual, categoria').eq('activo', true).order('posicion_actual', { ascending: true });
          if (jugadoresRecalculados && jugadoresRecalculados.length > 1) {
            const nuevosPartidos = [];
            if (modalidad === 'Escalera') {
              const posMap: Record<number, any> = {};
              jugadoresRecalculados.forEach(j => { posMap[Number(j.posicion_actual)] = j; });
              const maxPos = Math.max(...jugadoresRecalculados.map(j => Number(j.posicion_actual)));
              if (posMap[4] && posMap[2]) nuevosPartidos.push({ fecha_id: nuevaFechaRow.id, desafiante_id: posMap[4].id, aceptante_id: posMap[2].id, games_desafiante: null, games_aceptante: null });
              for (let p = 6; p <= maxPos; p += 2) {
                if (posMap[p] && posMap[p - 3]) nuevosPartidos.push({ fecha_id: nuevaFechaRow.id, desafiante_id: posMap[p].id, aceptante_id: posMap[p - 3].id, games_desafiante: null, games_aceptante: null });
              }
            } else {
              ['A', 'B', 'C', 'D'].forEach(cat => {
                const jugDeCat = jugadoresRecalculados.filter(j => j.categoria === cat);
                for (let i = 0; i < jugDeCat.length; i += 2) {
                  if (jugDeCat[i] && jugDeCat[i + 1]) nuevosPartidos.push({ fecha_id: nuevaFechaRow.id, desafiante_id: jugDeCat[i + 1].id, aceptante_id: jugDeCat[i].id, games_desafiante: null, games_aceptante: null });
                }
              });
            }
            if (nuevosPartidos.length > 0) await supabase.from('partidos').insert(nuevosPartidos);
          }
          setStatus({ type: 'success', text: `¡Cierre exitoso! ${nombreProximaFecha} lista y activa.` });
          setFechaACerrar(''); setNombreProximaFecha(''); setFechaInicioNueva(''); setFechaFinNueva('');
          await cargarJugadoresVivos(); await onRefresh();
        } catch (err: any) { setStatus({ type: 'error', text: err.message }); } finally { setLoading(false); }
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2 relative">
      
      {/* DIÁLOGO DE CONFIRMACIÓN EMBEBIDO PRO (Glassmorphic Effect) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl backdrop-blur-xl scale-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              {confirmModal.variant === 'danger' ? (
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"><Trash2 size={18} /></div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400"><AlertTriangle size={18} /></div>
              )}
              <h4 className="text-sm font-display font-bold text-text uppercase tracking-wide">{confirmModal.title}</h4>
            </div>
            
            <p className="text-xs text-text-muted mt-3 leading-relaxed font-sans">{confirmModal.message}</p>
            
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-white/5">
              <button 
                type="button" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="bg-white/5 hover:bg-white/10 text-text-subtle text-xs px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  confirmModal.onConfirm();
                }}
                className={`text-white text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-md ${
                  confirmModal.variant === 'danger' 
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95'
                }`}
              >
                Confirmar Acción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div className="glass-card rounded-2xl p-5 border border-surface-3/30 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl text-text tracking-wide uppercase">⚙️ Consola de Organización Profesional</h2>
          <p className="text-xs text-text-muted mt-1 font-mono">INTEGRACIÓN COMPLETA COMPLETADA · 2026</p>
        </div>
        <button onClick={cargarJugadoresVivos} className="bg-surface-3 hover:bg-surface-4 text-text-subtle p-2 rounded-xl text-xs flex items-center gap-1.5"><RefreshCw size={12} /> Sincronizar Listas</button>
      </div>

      {/* FLOATING STATUS (Tipo Toast Moderno Auto-dismiss) */}
      {status && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl flex gap-3 items-center border shadow-2xl backdrop-blur-xl z-40 transition-all duration-300 animate-in slide-in-from-bottom-5 ${status.type === 'success' ? 'bg-slate-900/90 border-green-500/30 text-green-400' : 'bg-slate-900/90 border-red-500/30 text-red-400'}`}>
          {status.type === 'success' ? <CheckCircle size={18} className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" /> : <AlertTriangle size={18} className="text-red-400" />}
          <span className="text-xs font-medium font-sans">{status.text}</span>
          <button onClick={() => setStatus(null)} className="ml-2 text-text-muted hover:text-text"><X size={14}/></button>
        </div>
      )}

      {/* CONFIGURADOR MASIVO Y SORTEO */}
      <div className="glass-card rounded-2xl p-5 border border-surface-3/10 space-y-4 bg-surface-1/50">
        <div className="flex items-center gap-2 pb-2 border-b border-surface-3">
          <Sparkles size={16} className="text-purple-400" />
          <h3 className="font-bold text-sm text-text uppercase tracking-wider">🎲 Inicializar Torneo (Carga Masiva y Sorteo de Doble Bombo)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[0.65rem] text-text-muted flex items-center gap-1">
              <ClipboardCopy size={12}/> 1. Pegá las columnas de tu Excel aquí:
            </label>
            <textarea 
              value={excelPasteText}
              onChange={e => setExcelPasteText(e.target.value)}
              placeholder="Ejemplo:&#10;Juan Perez	A	5551234&#10;Gaby Flores	B	5555678"
              className="w-full bg-surface-2 text-text border border-surface-3 rounded-lg p-2 text-xs font-mono h-24 outline-none resize-none focus:border-purple-500"
            />
            <button type="button" onClick={handleCargaMasivaExcel} className="bg-surface-3 hover:bg-surface-4 border border-surface-4 text-text-subtle text-xs px-3 py-1.5 rounded-md font-bold transition-all">
              Procesar e Importar Bloque
            </button>
          </div>

          <div className="space-y-3 bg-background/30 p-3 rounded-xl border border-surface-3/60 flex flex-col justify-between">
            <div className="space-y-2">
              <label className="block text-[0.65rem] text-purple-400 font-bold uppercase tracking-wider">2. Rango de Fechas para la Etapa 1:</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[0.55rem] text-text-muted mb-0.5">Inicio:</span>
                  <input type="date" value={fecha1Inicio} onChange={e => setFecha1Inicio(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded p-1 text-xs text-center font-mono" />
                </div>
                <div>
                  <span className="block text-[0.55rem] text-text-muted mb-0.5">Fin:</span>
                  <input type="date" value={fecha1Fin} onChange={e => setFecha1Fin(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded p-1 text-xs text-center font-mono" />
                </div>
              </div>
            </div>
            <button type="button" onClick={handleEjecutarSorteoInicial} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs py-2.5 rounded-lg shadow-lg transition-all transform hover:scale-[1.01]">
              Mezclar por Doble Bombo (A-B / C-D) y Lanzar
            </button>
          </div>
        </div>
      </div>

      {/* REGISTRAR JUGADOR INDIVIDUAL */}
      <div className="glass-card rounded-2xl p-5 border border-surface-3/10 space-y-4 bg-surface-1/50">
        <div className="flex items-center gap-2 pb-2 border-b border-surface-3"><UserPlus size={16} className="text-[#4dff91]" /><h3 className="font-bold text-sm text-text uppercase tracking-wider">👥 Registrar Jugador Individual</h3></div>
        <form onSubmit={handleAggregateJugador} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div><label className="block text-[0.65rem] text-text-muted mb-1">Nombre:</label><input type="text" required value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Ej: Juan Perez" className="w-full bg-surface-2 text-text border border-surface-3 rounded-lg px-3 py-1.5 text-xs outline-none" /></div>
          <div><label className="block text-[0.65rem] text-text-muted mb-1">Categoría:</label><select value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded-lg px-3 py-1.5 text-xs cursor-pointer"><option value="A">Categoría A</option><option value="B">Categoría B</option><option value="C">Categoría C</option><option value="D">Categoría D</option></select></div>
          <div><label className="block text-[0.65rem] text-text-muted mb-1">Avatar:</label><input id="nuevo-foto-input" type="file" accept="image/*" onChange={e => setNuevoFotoFile(e.target.files?.[0] || null)} className="w-full bg-surface-2 text-text border border-surface-3 rounded-lg px-2 py-1 text-xs cursor-pointer" /></div>
          <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">{loading ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />} Guardar</button>
        </form>
      </div>

      {/* TARJETAS OPERATIVAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* MARCADORES */}
        <div className="glass-card rounded-2xl p-4 border border-surface-3/10 space-y-3">
          <div className="flex items-center gap-1.5 pb-1 border-b border-surface-3"><Trophy size={14} className="text-[#E8521A]" /><h3 className="font-bold text-xs text-text uppercase tracking-wider">🏆 Marcadores</h3></div>
          <form onSubmit={handleCargarResultado} className="space-y-2">
            <div><label className="block text-[0.65rem] text-text-muted mb-0.5">Etapa:</label><select value={fechaFiltroResultados} onChange={e => { setFechaFiltroResultados(e.target.value); setPartidoSeleccionado(''); }} className="w-full bg-surface-2 text-text border border-surface-3 rounded-md px-2 py-1 text-xs outline-none"><option value="">-- Seleccionar --</option>{fechasData.map((f: any) => <option key={f.id} value={f.nombre}>{f.nombre}</option>)}</select></div>
            {fechaFiltroResultados && (<div><label className="block text-[0.65rem] text-text-muted mb-0.5">Partido:</label><select value={partidoSeleccionado} onChange={e => setPartidoSeleccionado(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded-md px-2 py-1 text-xs outline-none"><option value="">-- Ver encuentros --</option>{partidosDeFecha.map((p: any) => <option key={p.id} value={p.id}>{p.jugador_d} vs {p.jugador_a} {p.games_d !== null ? `(${p.games_d}-${p.games_a})` : '(Pendiente)'}</option>)}</select></div>)}
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-[0.6rem] text-text-muted mb-0.5">Games Des:</label><input type="number" min="0" max="3" value={gamesDesafiante} onChange={e => setGamesDesafiante(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-surface-2 text-text border border-surface-3 rounded-md py-1 text-xs text-center font-mono" /></div>
              <div><label className="block text-[0.6rem] text-text-muted mb-0.5">Games Ace:</label><input type="number" min="0" max="3" value={gamesAceptante} onChange={e => setGamesAceptante(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-surface-2 text-text border border-surface-3 rounded-md py-1 text-xs text-center font-mono" /></div>
            </div>
            <button type="submit" disabled={loading || !partidoSeleccionado} className="w-full bg-[#E8521A] text-white py-1.5 rounded-md text-xs font-bold hover:bg-[#ff6b36] transition-all">Cargar Tablero</button>
          </form>
        </div>

        {/* PARTIDO ESPECIAL */}
        <div className="glass-card rounded-2xl p-4 border border-surface-3/10 space-y-3 bg-gradient-to-b from-[#f5a623]/5 to-transparent">
          <div className="flex items-center gap-1.5 pb-1 border-b border-surface-3"><PlusCircle size={14} className="text-[#f5a623]" /><h3 className="font-bold text-xs text-text uppercase tracking-wider">🎾 Crear Partido Especial</h3></div>
          <form onSubmit={handleCrearPartidoManual} className="space-y-2">
            <div><label className="block text-[0.65rem] text-text-muted mb-0.5">Asignar a Etapa:</label><select value={crearPartidoFechaId} onChange={e => setCrearPartidoFechaId(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded-md px-2 py-1 text-xs outline-none"><option value="">-- Seleccionar --</option>{fechasData.map((f: any) => <option key={f.id} value={f.id}>{f.nombre}</option>)}</select></div>
            <div><label className="block text-[0.65rem] text-text-muted mb-0.5">Jugador 1 (Desafiante):</label><select value={crearDesafianteId} onChange={e => setCrearDesafianteId(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded-md px-2 py-1 text-xs outline-none"><option value="">-- Buscar por Nombre --</option>{jugadoresAlfabetico.map(j => <option key={j.id} value={j.id}>{j.nombre} ({j.categoria})</option>)}</select></div>
            <div><label className="block text-[0.65rem] text-text-muted mb-0.5">Jugador 2 (Aceptante):</label><select value={crearAceptanteId} onChange={e => setCrearAceptanteId(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded-md px-2 py-1 text-xs outline-none"><option value="">-- Buscar por Nombre --</option>{jugadoresAlfabetico.map(j => <option key={j.id} value={j.id}>{j.nombre} ({j.categoria})</option>)}</select></div>
            <button type="submit" disabled={loading || !crearPartidoFechaId || !crearDesafianteId || !crearAceptanteId} className="w-full bg-yellow-600 text-white py-1.5 rounded-md text-xs font-bold hover:bg-yellow-500 transition-all">Insertar en Fixture</button>
          </form>
        </div>

        {/* CIERRE ETAPA */}
        <div className="glass-card rounded-2xl p-4 border border-surface-3/10 space-y-3">
          <div className="flex items-center gap-1.5 pb-1 border-b border-surface-3"><Calendar size={14} className="text-[#4dff91]" /><h3 className="font-bold text-xs text-text uppercase tracking-wider">🎬 Cierre Etapa</h3></div>
          <div className="space-y-2">
            <div><label className="block text-[0.65rem] text-text-muted mb-0.5">¿Qué fecha cerrás?</label><select value={fechaACerrar} onChange={e => setFechaACerrar(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded-md px-2 py-1 text-xs outline-none"><option value="">-- Seleccionar --</option>{fechasData.map((f: any) => <option key={f.id} value={f.nombre}>{f.nombre}</option>)}</select></div>
            <div><label className="block text-[0.65rem] text-text-muted mb-0.5">Próxima Fecha:</label><input type="text" value={nombreProximaFecha} onChange={e => setNombreProximaFecha(e.target.value)} placeholder="Ej: Fecha 7" className="w-full bg-surface-2 text-text border border-surface-3 rounded-md px-2 py-1 text-xs font-mono" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[0.58rem] text-yellow-500 font-bold mb-0.5">📅 Inicio:</label>
                <input type="date" value={fechaInicioNueva} onChange={e => setFechaInicioNueva(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded p-1 text-[0.7rem] font-mono text-center" />
              </div>
              <div>
                <label className="block text-[0.58rem] text-yellow-500 font-bold mb-0.5">📅 Fin:</label>
                <input type="date" value={fechaFinNueva} onChange={e => setFechaFinNueva(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded p-1 text-[0.7rem] font-mono text-center" />
              </div>
            </div>
            <div><label className="block text-[0.65rem] text-text-muted mb-0.5">Modalidad:</label><select value={modalidad} onChange={e => setModalidad(e.target.value)} className="w-full bg-surface-2 text-text border border-surface-3 rounded-md px-2 py-1 text-xs outline-none"><option value="Escalera">Escalera Global</option><option value="Categorias">Por Categorías</option></select></div>
            <button onClick={handleProcesarCierre} disabled={loading || !fechaACerrar || !nombreProximaFecha || !fechaInicioNueva || !fechaFinNueva} className="w-full bg-surface-3 border border-surface-4 text-text py-1.5 rounded-md text-xs font-bold hover:bg-surface-4 transition-all">Congelar Historial</button>
          </div>
        </div>

      </div>

      {/* RE-EMPAREJAR Y REMOVER CRUCES */}
      {fechaFiltroResultados && (
        <div className="glass-card rounded-2xl p-5 border border-surface-3/10 space-y-4 bg-surface-1/20">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-3"><Users size={16} className="text-[#f5a623]" /><h3 className="font-bold text-sm text-text uppercase tracking-wider">📝 Re-emparejar o Remover Cruces de la {fechaFiltroResultados}</h3></div>
          <p className="text-[0.7rem] text-text-muted">Usá esta sección para cambiar contrincantes de forma manual o eliminar por completo partidos.</p>
          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto p-1 border border-surface-3 rounded-xl">
            {partidosDeFecha.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between bg-background/50 p-2.5 rounded-lg border border-surface-3/60 flex-wrap gap-2 text-xs">
                {idPartidoEditandoCruce === p.id ? (
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <select value={editDesafianteId} onChange={e => setEditDesafianteId(e.target.value)} className="bg-surface-2 text-text text-xs p-1 rounded border border-surface-4 outline-none max-w-[200px]">{jugadoresAlfabetico.map(j => <option key={j.id} value={j.id}>{j.nombre} ({j.categoria})</option>)}</select>
                    <span className="text-text-muted font-bold font-mono">VS</span>
                    <select value={editAceptanteId} onChange={e => setEditAceptanteId(e.target.value)} className="bg-surface-2 text-text text-xs p-1 rounded border border-surface-4 outline-none max-w-[200px]">{jugadoresAlfabetico.map(j => <option key={j.id} value={j.id}>{j.nombre} ({j.categoria})</option>)}</select>
                    <button type="button" onClick={() => handleGuardarCruceManual(p.id)} className="p-1 bg-green-600 text-white rounded text-[0.7rem] font-bold px-2 transition-all">Confirmar</button>
                    <button type="button" onClick={() => setIdPartidoEditandoCruce(null)} className="p-1 bg-surface-4 text-text rounded text-[0.7rem] px-2"><X size={12}/></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text">{p.jugador_d}</span> <span className="text-text-muted font-mono">vs</span> <span className="font-semibold text-text">{p.jugador_a}</span>
                      {p.games_d !== null && <span className="bg-green-500/10 text-green-400 text-[0.65rem] px-1.5 py-0.5 rounded border border-green-500/20 font-mono">{p.games_d}-{p.games_a}</span>}
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <button type="button" disabled={p.games_d !== null} onClick={() => activarEdicionCruce(p)} className="text-text-muted hover:text-[#f5a623] p-1 flex items-center gap-1 disabled:opacity-20 transition-all"><Edit2 size={11} /> <span className="text-[0.65rem]">Editar</span></button>
                      <div className="w-[1px] h-3 bg-surface-3 mx-1"></div>
                      <button type="button" onClick={() => handleEliminarPartidoFixture(p.id, `${p.jugador_d} vs ${p.jugador_a}`)} className="text-red-400 hover:text-red-300 p-1 flex items-center gap-1 transition-all"><Trash2 size={11} /> <span className="text-[0.65rem]">Eliminar</span></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRILLA VIVA CON SKELETON INTEGRADO */}
      <div className="glass-card rounded-2xl p-5 border border-surface-3/10 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-surface-3 flex-wrap gap-2">
          <div className="flex items-center gap-2"><Save size={16} className="text-[#4dff91]" /><h3 className="font-bold text-sm text-text uppercase tracking-wider">🛠️ Modificación de Posiciones (Ranking Vivo)</h3></div>
          <button onClick={handleGuardarRankingManual} disabled={loading || jugadoresLive.length === 0} className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs py-1.5 px-4 rounded-xl flex items-center gap-1.5 shadow-lg transition-all"><CheckCircle size={13} /> Guardar Orden de Ranking Oficial</button>
        </div>

        {loadingLivePlayers ? (
          /* SKELETON LOADER CON ESTILO GLASSMORPHIC PULSE */
          <div className="border border-surface-3/50 rounded-xl overflow-hidden space-y-1 bg-background/30 p-1 animate-pulse">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex items-center justify-between bg-surface-1/30 border border-surface-3/10 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-5 h-4 bg-surface-3/40 rounded-md" />
                  <div className="w-6 h-6 rounded-full bg-surface-3/40 border border-white/5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-surface-3/50 rounded w-1/3 min-w-[120px]" />
                    <div className="h-2.5 bg-surface-3/30 rounded w-12" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-surface-3/30 rounded-md" />
                  <div className="w-6 h-6 bg-surface-3/30 rounded-md" />
                  <div className="w-6 h-6 bg-red-500/10 border border-red-500/10 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* CONTENEDOR DE DATOS REALES */
          <div className="border border-surface-3 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto space-y-0.5 bg-background/50 p-1">
            {jugadoresLive.map((j, idx) => (
              <div key={j.id} className="flex items-center justify-between bg-surface-1/80 border border-surface-3/40 rounded-lg px-3 py-1.5 hover:border-surface-4 transition-all">
                <div className="flex items-center gap-3 flex-1">
                  <span className="rank-num text-sm font-bold text-text-muted w-6 text-right font-mono">{idx + 1}</span>
                  {j.foto_url && idJugadorEditando !== j.id && (<img src={j.foto_url} alt={j.nombre} className="w-6 h-6 rounded-full object-cover border border-white/10" onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />)}
                  {idJugadorEditando === j.id ? (
                    <div className="flex items-center gap-2 flex-wrap flex-1 bg-surface-2 p-1.5 rounded-lg border border-surface-4 animate-in fade-in duration-200">
                      <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)} className="bg-background text-text text-xs px-2 py-0.5 rounded border border-surface-3 min-w-[140px]" />
                      <select value={editCategoria} onChange={e => setEditCategoria(e.target.value)} className="bg-background text-text text-xs px-2 py-0.5 rounded border border-surface-3"><option value="A">CAT A</option><option value="B">CAT B</option><option value="C">CAT C</option><option value="D">CAT D</option></select>
                      <div className="flex items-center gap-1 bg-background px-2 py-0.5 rounded border border-surface-3"><span className="text-[0.6rem] text-text-muted uppercase">Foto:</span><input type="file" accept="image/*" onChange={e => setEditFotoFile(e.target.files?.[0] || null)} className="text-[0.65rem] text-text max-w-[130px]" /></div>
                      <button type="button" onClick={() => handleGuardarEdicionBase(j.id)} className="p-1 bg-green-600 text-white rounded transition-all"><CheckCircle size={12} /></button>
                      <button type="button" onClick={() => setIdJugadorEditando(null)} className="p-1 bg-surface-4 text-text rounded"><X size={12} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div><div className="font-semibold text-xs text-text">{j.nombre}</div><span className={`cat-badge cat-${j.categoria?.toLowerCase()} text-[0.5rem] px-1`}>CAT {j.categoria || '—'}</span></div>
                      <button type="button" onClick={() => activarEdicion(j)} className="text-text-muted hover:text-text p-1 transition-all"><Edit2 size={10} /></button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={idx === 0 || loading || idJugadorEditando !== null} onClick={() => moverJugadorLocal(idx, 'subir')} className="w-6 h-6 bg-surface-2 border border-surface-3 rounded flex items-center justify-center text-text-muted hover:text-text disabled:opacity-10 transition-all"><ArrowUp size={10} /></button>
                  <button type="button" disabled={idx === jugadoresLive.length - 1 || loading || idJugadorEditando !== null} onClick={() => moverJugadorLocal(idx, 'bajar')} className="w-6 h-6 bg-surface-2 border border-surface-3 rounded flex items-center justify-center text-text-muted hover:text-text disabled:opacity-10 transition-all"><ArrowDown size={10} /></button>
                  <button type="button" disabled={loading || idJugadorEditando !== null} onClick={() => handleBajaJugador(j.id, j.nombre)} className="w-6 h-6 bg-red-950/20 border border-red-900/30 rounded flex items-center justify-center text-red-400 hover:bg-red-900/50 transition-all"><Trash2 size={10} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}