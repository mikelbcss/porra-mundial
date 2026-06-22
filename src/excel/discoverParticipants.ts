import { parseParticipantUrl } from './parser';
import type { PrediccionesParticipante } from '@/types/domain';

const MANIFEST_URL = '/data/excel/manifest.json';
const EXCEL_BASE = '/data/excel';

/** Lee manifest.json y devuelve la lista de nombres de participantes. */
export async function fetchParticipantNames(): Promise<string[]> {
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(`No se pudo cargar el manifiesto: HTTP ${res.status}`);
  const names: string[] = await res.json();
  return names;
}

/** Descarga y parsea todos los Excels listados en el manifiesto. */
export async function loadAllParticipants(): Promise<PrediccionesParticipante[]> {
  const names = await fetchParticipantNames();
  const results = await Promise.allSettled(
    names.map((nombre) => {
      const url = `${EXCEL_BASE}/Excel-Mundial-2026_${nombre}.xlsx`;
      return parseParticipantUrl(url, nombre);
    }),
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    console.error(`Error cargando participante ${names[i]}:`, r.reason);
    return {
      nombre: names[i],
      partidosGrupos: [],
      posicionesGrupo: [],
      dieciseisavos: [],
      octavos: [],
      cuartos: [],
      semis: [],
      tercerPuesto: [],
      final: [],
      podio: { campeon: null, subcampeon: null, tercero: null },
      jugadores: { pichichi: null, mvp: null },
      erroresLectura: [`Error de carga: ${(r.reason as Error).message}`],
    };
  });
}
