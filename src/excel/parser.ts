import * as XLSX from 'xlsx';
import { LAYOUT, SHEET_NAME } from './layout';
import { cellAsNumber, cellAsString, sheetToGrid } from './sheetUtils';
import type { SheetGrid } from './sheetUtils';
import { canonicalTeamName } from '@/footballApi/teamNames';
import type {
  PrediccionesParticipante,
  PrediccionPartido,
  PrediccionPosicionGrupo,
  PrediccionPodio,
  PrediccionJugadores,
  Signo,
} from '@/types/domain';

function computeSigno(golCasa: number | null, golFuera: number | null): Signo | null {
  if (golCasa === null || golFuera === null) return null;
  if (golCasa > golFuera) return '1';
  if (golCasa === golFuera) return 'X';
  return '2';
}

function readPartidosGrupos(grid: SheetGrid): PrediccionPartido[] {
  const { headerRow0, nrows, cols } = LAYOUT.partidosGrupos;
  const partidos: PrediccionPartido[] = [];
  for (let i = 1; i <= nrows; i++) {
    const row0 = headerRow0 + i;
    const jornada = cellAsString(grid, row0, cols.jornada);
    const casa = cellAsString(grid, row0, cols.casa);
    const fuera = cellAsString(grid, row0, cols.fuera);
    if (!jornada || !casa || !fuera) continue;
    if (!/^J[123]$/i.test(jornada)) continue;
    const golCasa = cellAsNumber(grid, row0, cols.gol);
    const golFuera = cellAsNumber(grid, row0, cols.golFuera);
    partidos.push({
      jornada: jornada.toUpperCase(),
      casa: canonicalTeamName(casa) ?? casa,
      fuera: canonicalTeamName(fuera) ?? fuera,
      golCasa,
      golFuera,
      signo: computeSigno(golCasa, golFuera),
    });
  }
  return partidos;
}

function readPosicionesGrupo(grid: SheetGrid): PrediccionPosicionGrupo[] {
  const { headerRow0, nrows, cols } = LAYOUT.posicionesGrupo;
  const posiciones: PrediccionPosicionGrupo[] = [];
  let grupoActual: string | null = null;
  let contadorEnGrupo = 0;
  for (let i = 1; i <= nrows; i++) {
    const row0 = headerRow0 + i;
    const posicion = cellAsNumber(grid, row0, cols.posicion);
    const seleccion = cellAsString(grid, row0, cols.seleccion);
    if (posicion === null || !seleccion) continue;
    if (contadorEnGrupo === 0) {
      grupoActual = grupoActual ? String.fromCharCode(grupoActual.charCodeAt(0) + 1) : 'A';
    }
    posiciones.push({
      grupo: grupoActual as string,
      seleccion: canonicalTeamName(seleccion) ?? seleccion,
      posicion,
    });
    contadorEnGrupo = (contadorEnGrupo + 1) % 4;
  }
  return posiciones;
}

function readTeamList(
  grid: SheetGrid,
  section: { headerRow0: number; nrows: number; cols: { casa: string; fuera: string } },
): string[] {
  const equipos: string[] = [];
  for (let i = 1; i <= section.nrows; i++) {
    const row0 = section.headerRow0 + i;
    const casa = cellAsString(grid, row0, section.cols.casa);
    const fuera = cellAsString(grid, row0, section.cols.fuera);
    if (casa) equipos.push(canonicalTeamName(casa) ?? casa);
    if (fuera) equipos.push(canonicalTeamName(fuera) ?? fuera);
  }
  return equipos;
}

function readPodio(grid: SheetGrid): PrediccionPodio {
  const { headerRow0, cols } = LAYOUT.podio;
  const v = (i: number) => cellAsString(grid, headerRow0 + i, cols.valor);
  return {
    campeon: v(1) ? canonicalTeamName(v(1)) : null,
    subcampeon: v(2) ? canonicalTeamName(v(2)) : null,
    tercero: v(3) ? canonicalTeamName(v(3)) : null,
  };
}

function readJugadores(grid: SheetGrid): PrediccionJugadores {
  const { headerRow0, cols, filaPichichi, filaMvp } = LAYOUT.jugadores;
  return {
    pichichi: cellAsString(grid, headerRow0 + 1 + filaPichichi, cols.valor),
    mvp: cellAsString(grid, headerRow0 + 1 + filaMvp, cols.valor),
  };
}

/** Descarga y parsea el Excel de un participante desde /public/data/excel/. */
export async function parseParticipantUrl(
  url: string,
  nombre: string,
): Promise<PrediccionesParticipante> {
  const erroresLectura: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    workbook = XLSX.read(ab, { type: 'array' });
  } catch (err) {
    erroresLectura.push(`No se pudo cargar el fichero: ${(err as Error).message}`);
    return emptyParticipant(nombre, erroresLectura);
  }

  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    erroresLectura.push(
      `Hoja "${SHEET_NAME}" no encontrada. Hojas: ${workbook.SheetNames.join(', ')}`,
    );
    return emptyParticipant(nombre, erroresLectura);
  }

  const grid = sheetToGrid(sheet);

  const safe = <T>(label: string, fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch (err) {
      erroresLectura.push(`${label}: ${(err as Error).message}`);
      return fallback;
    }
  };

  return {
    nombre,
    partidosGrupos: safe('partidosGrupos', () => readPartidosGrupos(grid), []),
    posicionesGrupo: safe('posicionesGrupo', () => readPosicionesGrupo(grid), []),
    dieciseisavos: safe('dieciseisavos', () => readTeamList(grid, LAYOUT.dieciseisavos), []),
    octavos: safe('octavos', () => readTeamList(grid, LAYOUT.octavos), []),
    cuartos: safe('cuartos', () => readTeamList(grid, LAYOUT.cuartos), []),
    semis: safe('semis', () => readTeamList(grid, LAYOUT.semis), []),
    tercerPuesto: safe('tercerPuesto', () => readTeamList(grid, LAYOUT.tercerPuesto), []),
    final: safe('final', () => readTeamList(grid, LAYOUT.final), []),
    podio: safe('podio', () => readPodio(grid), { campeon: null, subcampeon: null, tercero: null }),
    jugadores: safe('jugadores', () => readJugadores(grid), { pichichi: null, mvp: null }),
    erroresLectura,
  };
}

function emptyParticipant(nombre: string, erroresLectura: string[]): PrediccionesParticipante {
  return {
    nombre,
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
    erroresLectura,
  };
}
