import * as XLSX from 'xlsx';

/** Convierte una hoja de cálculo en un array 2D (fila × columna), indexado a 0. */
export type SheetGrid = ReturnType<typeof sheetToGrid>;
export function sheetToGrid(ws: XLSX.WorkSheet): (string | number | boolean | null)[][] {
  const ref = ws['!ref'];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const grid: (string | number | boolean | null)[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: (string | number | boolean | null)[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      row.push(cell != null ? (cell.v ?? null) : null);
    }
    grid.push(row);
  }
  return grid;
}

/** Letra de columna (una o dos letras) → índice 0-based. */
export function colLetterToIndex(letter: string): number {
  let n = 0;
  for (const ch of letter.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

export function cellAsString(
  grid: ReturnType<typeof sheetToGrid>,
  row0: number,
  colLetter: string,
): string | null {
  const val = grid[row0]?.[colLetterToIndex(colLetter)];
  if (val == null) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

export function cellAsNumber(
  grid: ReturnType<typeof sheetToGrid>,
  row0: number,
  colLetter: string,
): number | null {
  const val = grid[row0]?.[colLetterToIndex(colLetter)];
  return typeof val === 'number' ? val : null;
}
