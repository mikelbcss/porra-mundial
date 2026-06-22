import { Fase } from '@/types/domain';

/**
 * football-data.org usa un campo `stage` tipo "GROUP_STAGE", "LAST_16", etc.
 * El Mundial 2026 es el primero con 48 equipos y una ronda de 32 nueva, asi
 * que estos valores son una estimacion basada en como football-data.org nombra
 * fases en otras competiciones (Champions League: GROUP_STAGE, ROUND_OF_16,
 * QUARTER_FINALS, SEMI_FINALS, FINAL). Si al probar contra la API real algun
 * valor no encaja, este es el sitio para corregirlo: cualquier valor no
 * reconocido cae en 'DESCONOCIDA' sin romper nada.
 */
const STAGE_MAP: Record<string, Fase | 'TERCER_PUESTO' | 'DESCONOCIDA'> = {
  GROUP_STAGE: 'GRUPOS',
  ROUND_OF_32: 'DIECISEISAVOS',
  LAST_32: 'DIECISEISAVOS',
  ROUND_OF_16: 'OCTAVOS',
  LAST_16: 'OCTAVOS',
  QUARTER_FINALS: 'CUARTOS',
  SEMI_FINALS: 'SEMIS',
  THIRD_PLACE: 'TERCER_PUESTO',
  FINAL: 'FINAL',
};

export function mapStage(rawStage: string): Fase | 'TERCER_PUESTO' | 'DESCONOCIDA' {
  return STAGE_MAP[rawStage] ?? 'DESCONOCIDA';
}

/** Convierte "Group A" -> "A". Si no hay grupo (fases eliminatorias) devuelve null. */
export function normalizeGroupLabel(rawGroup: string | null): string | null {
  if (!rawGroup) return null;
  const match = rawGroup.match(/([A-L])\s*$/i);
  return match ? match[1].toUpperCase() : rawGroup;
}
