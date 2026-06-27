import {
  EstadoPartido,
  Fase,
  PartidoReal,
  PrediccionPodio,
  PuestoGrupoReal,
} from '@/types/domain';
import { canonicalTeamName } from './teamNames';
import { mapStage, normalizeGroupLabel } from './stageMap';
import {
  RawMatch,
  RawMatchesResponse,
  RawScorersResponse,
  RawStandingsResponse,
} from './rawTypes';

function computeSigno(golCasa: number | null, golFuera: number | null): PartidoReal['signo'] {
  if (golCasa === null || golFuera === null) return null;
  if (golCasa > golFuera) return '1';
  if (golCasa === golFuera) return 'X';
  return '2';
}

/** En fase de grupos la API no da "jornada" (J1/J2/J3) directamente; la derivamos de `matchday`. */
function inferJornada(stage: Fase | 'TERCER_PUESTO' | 'DESCONOCIDA', matchday: number | null): string | null {
  if (stage !== 'GRUPOS' || matchday === null) return null;
  return `J${matchday}`;
}

export function normalizeMatch(raw: RawMatch): PartidoReal {
  const stage = mapStage(raw.stage);
  const golCasa = raw.score?.fullTime?.home ?? null;
  const golFuera = raw.score?.fullTime?.away ?? null;
  return {
    id: raw.id,
    fechaUtc: raw.utcDate,
    estado: raw.status as EstadoPartido,
    fase: stage === 'TERCER_PUESTO' ? 'DESCONOCIDA' : stage,
    grupo: normalizeGroupLabel(raw.group),
    casa: canonicalTeamName(raw.homeTeam?.name) ?? raw.homeTeam?.name ?? '?',
    fuera: canonicalTeamName(raw.awayTeam?.name) ?? raw.awayTeam?.name ?? '?',
    golCasa,
    golFuera,
    signo: computeSigno(golCasa, golFuera),
    jornada: inferJornada(stage, raw.matchday),
  };
}

export function normalizeMatches(raw: RawMatchesResponse): PartidoReal[] {
  return (raw.matches || []).map(normalizeMatch);
}

const FINISHED_STATUSES = new Set(['FINISHED', 'AWARDED']);

/**
 * Deriva que equipos han confirmado plaza en cada fase eliminatoria mirando,
 * sencillamente, que equipos aparecen jugando un partido de esa fase (en vez
 * de intentar recalcular las reglas de clasificacion del grupo a mano, que es
 * mucho mas propenso a errores con 12 grupos + mejores tercetos).
 */
export function deriveClasificadosPorFase(
  partidos: PartidoReal[]
): Record<Exclude<Fase, 'GRUPOS'>, string[]> {
  const fases: Exclude<Fase, 'GRUPOS'>[] = [
    'DIECISEISAVOS',
    'OCTAVOS',
    'CUARTOS',
    'SEMIS',
    'FINAL',
  ];
  const result = {} as Record<Exclude<Fase, 'GRUPOS'>, string[]>;
  for (const fase of fases) {
    const equipos = new Set<string>();
    for (const partido of partidos) {
      if (partido.fase !== fase) continue;
      // Solo contar equipos de partidos ya JUGADOS — los SCHEDULED ya tienen
      // el cuadro montado por la API pero no se han disputado todavía.
      if (partido.estado !== 'FINISHED') continue;
      equipos.add(partido.casa);
      equipos.add(partido.fuera);
    }
    result[fase] = Array.from(equipos);
  }
  return result;
}

/** Campeon/subcampeon a partir del partido FINAL ya jugado; tercero a partir del de 3º puesto. */
export function derivePodio(rawMatches: RawMatch[]): PrediccionPodio {
  const finalMatch = rawMatches.find((m) => mapStage(m.stage) === 'FINAL' && FINISHED_STATUSES.has(m.status));
  const tercerPuesto = rawMatches.find(
    (m) => mapStage(m.stage) === 'TERCER_PUESTO' && FINISHED_STATUSES.has(m.status)
  );

  let campeon: string | null = null;
  let subcampeon: string | null = null;
  if (finalMatch) {
    const home = canonicalTeamName(finalMatch.homeTeam?.name);
    const away = canonicalTeamName(finalMatch.awayTeam?.name);
    const winner = finalMatch.score?.winner;
    if (winner === 'HOME_TEAM') {
      campeon = home;
      subcampeon = away;
    } else if (winner === 'AWAY_TEAM') {
      campeon = away;
      subcampeon = home;
    }
  }

  let tercero: string | null = null;
  if (tercerPuesto) {
    const home = canonicalTeamName(tercerPuesto.homeTeam?.name);
    const away = canonicalTeamName(tercerPuesto.awayTeam?.name);
    const winner = tercerPuesto.score?.winner;
    if (winner === 'HOME_TEAM') tercero = home;
    else if (winner === 'AWAY_TEAM') tercero = away;
  }

  return { campeon, subcampeon, tercero };
}

export function normalizeStandings(raw: RawStandingsResponse): PuestoGrupoReal[] {
  const rows: PuestoGrupoReal[] = [];
  for (const grupo of raw.standings || []) {
    if (grupo.type !== 'TOTAL') continue;
    const grupoLabel = normalizeGroupLabel(grupo.group) || grupo.group || '?';
    for (const fila of grupo.table) {
      rows.push({
        grupo: grupoLabel,
        posicion: fila.position,
        equipo: canonicalTeamName(fila.team?.name) ?? fila.team?.name ?? '?',
        jugados: fila.playedGames,
        ganados: fila.won,
        empatados: fila.draw,
        perdidos: fila.lost,
        golesFavor: fila.goalsFor,
        golesContra: fila.goalsAgainst,
        puntos: fila.points,
      });
    }
  }
  return rows.sort((a, b) => (a.grupo === b.grupo ? a.posicion - b.posicion : a.grupo.localeCompare(b.grupo)));
}

export function normalizeTopScorer(raw: RawScorersResponse): string | null {
  const top = raw.scorers?.[0];
  return top ? top.player.name : null;
}
