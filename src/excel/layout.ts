/**
 * Layout de la hoja "WORLDCUP" de cada Excel-Mundial-2026_<Nombre>.xlsx
 *
 * Esto es una traduccion 1:1 de los `skiprows` / `usecols` / `nrows` que ya
 * usaba el notebook de Jupyter (funciones `read_*_v0`). Si al probarlo con un
 * Excel real algo no cuadra, este es el UNICO fichero que hay que tocar: cada
 * seccion tiene su fila de cabecera (`headerRow0`, indice de fila 0-based,
 * igual que pandas `skiprows`) y su rango de columnas (letras de Excel).
 *
 * No se ha podido validar contra un Excel real porque no se subio ninguno
 * junto al notebook: revisa estos numeros con un fichero de verdad antes de
 * confiar del todo en los resultados.
 */

export function colLetterToIndex(letter: string): number {
  let result = 0;
  for (const ch of letter.toUpperCase()) {
    result = result * 26 + (ch.charCodeAt(0) - 64);
  }
  return result - 1; // 0-indexed
}

export interface SectionLayout {
  /** Fila (0-indexed) donde esta la cabecera de la seccion = pandas `skiprows`. */
  headerRow0: number;
  /** Numero de filas de datos tras la cabecera = pandas `nrows`. */
  nrows: number;
}

export const SHEET_NAME = 'WORLDCUP';

export const LAYOUT = {
  /** Partidos de fase de grupos (J1, J2, J3). Columnas Z:AF. */
  partidosGrupos: {
    headerRow0: 2,
    nrows: 94,
    cols: {
      jornada: 'Z',
      casa: 'AA',
      gol: 'AC',
      golFuera: 'AD',
      fuera: 'AF',
    },
  },
  /** Clasificacion prevista dentro de cada grupo. Columnas AJ:AL. */
  posicionesGrupo: {
    headerRow0: 4,
    nrows: 94,
    cols: {
      posicion: 'AJ',
      seleccion: 'AL',
    },
  },
  /** Equipos que el participante cree que llegan a cada fase. Columnas AA:AF (solo se usan Casa/Fuera). */
  dieciseisavos: { headerRow0: 99, nrows: 16, cols: { casa: 'AA', fuera: 'AF' } },
  octavos: { headerRow0: 118, nrows: 8, cols: { casa: 'AA', fuera: 'AF' } },
  cuartos: { headerRow0: 129, nrows: 4, cols: { casa: 'AA', fuera: 'AF' } },
  semis: { headerRow0: 136, nrows: 2, cols: { casa: 'AA', fuera: 'AF' } },
  /**
   * Partido por el tercer puesto (filas 142-143 en Excel 1-based):
   * headerRow0=141 → cabecera en fila 0-based 141 = Excel fila 142,
   * dato en fila 0-based 142 = Excel fila 143.
   */
  tercerPuesto: { headerRow0: 141, nrows: 1, cols: { casa: 'AA', fuera: 'AF' } },
  /**
   * Final (filas 146-147 en Excel 1-based):
   * headerRow0=145 → cabecera en fila 0-based 145 = Excel fila 146,
   * dato en fila 0-based 146 = Excel fila 147.
   */
  final: { headerRow0: 145, nrows: 1, cols: { casa: 'AA', fuera: 'AF' } },
  /** Podio: campeon, subcampeon, tercero (en ese orden), columna AA. */
  podio: { headerRow0: 148, nrows: 3, cols: { valor: 'AA' } },
  /** Jugadores: fila 0 = pichichi (Bota de Oro), fila 4 = MVP (Balon de Oro). Columna AA. */
  jugadores: { headerRow0: 152, nrows: 9, cols: { valor: 'AA' }, filaPichichi: 0, filaMvp: 4 },
} as const;

/** Patron para extraer el nombre del participante del nombre de fichero. */
export const FILENAME_PATTERN = /^Excel-Mundial-2026_(.+)\.xlsx$/i;

/**
 * Nombres de fichero a ignorar aunque cumplan el patron (ficheros de trabajo
 * del propio notebook que no son un participante real).
 */
export const EXCLUDED_PARTICIPANT_NAMES = new Set(
  ['maestro', 'maestro1', 'unificado', 'unificado_2', 'plantilla', 'template'].map((s) =>
    s.toLowerCase()
  )
);
