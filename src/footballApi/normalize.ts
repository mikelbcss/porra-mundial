import {
  EstadoPartido, Fase, Gol, PartidoReal, PrediccionPodio, PuestoGrupoReal,
} from '@/types/domain';
import { canonicalTeamName } from './teamNames';
import { mapStage, normalizeGroupLabel } from './stageMap';
import {
  RawGoal, RawMatch, RawMatchesResponse, RawScorersResponse, RawStandingsResponse,
} from './rawTypes';

function computeSigno(a: number | null, b: number | null): PartidoReal['signo'] {
  if (a === null || b === null) return null;
  return a > b ? '1' : a === b ? 'X' : '2';
}

function inferJornada(stage: string, matchday: number | null): string | null {
  if (stage !== 'GRUPOS' || matchday === null) return null;
  return `J${matchday}`;
}

function normalizeGoal(g: RawGoal, homeName: string, awayName: string): Gol {
  const tipo = g.type === 'OWN' ? 'PROPIA' : g.type === 'PENALTY' ? 'PENALTI' : 'REGULAR';
  const esCasa = canonicalTeamName(g.team.name) === canonicalTeamName(homeName)
    || g.team.name === homeName;
  return {
    minuto: g.minute,
    minutoAnadido: g.injuryTime ?? null,
    tipo,
    equipo: canonicalTeamName(g.team.name) ?? g.team.name,
    goleador: g.scorer.name,
    asistencia: g.assist?.name ?? null,
    esCasa,
  };
}

function teamName(name: string | null | undefined): string {
  if (!name || name === 'TBD') return '?';
  return canonicalTeamName(name) ?? name;
}

export function normalizeMatch(raw: RawMatch): PartidoReal {
  const stage = mapStage(raw.stage);
  const golCasa = raw.score?.fullTime?.home ?? null;
  const golFuera = raw.score?.fullTime?.away ?? null;
  const homeName = raw.homeTeam?.name ?? '';
  const awayName = raw.awayTeam?.name ?? '';
  const goles: Gol[] = (raw.goals ?? []).map((g) => normalizeGoal(g, homeName, awayName));

  return {
    id: raw.id,
    fechaUtc: raw.utcDate,
    estado: raw.status as EstadoPartido,
    fase: stage,                    // TERCER_PUESTO ya no se mapea a DESCONOCIDA
    grupo: normalizeGroupLabel(raw.group),
    casa: teamName(homeName),
    fuera: teamName(awayName),
    golCasa,
    golFuera,
    signo: computeSigno(golCasa, golFuera),
    jornada: inferJornada(stage, raw.matchday),
    minutoActual: raw.minute ?? null,
    goles,
  };
}

export function normalizeMatches(raw: RawMatchesResponse): PartidoReal[] {
  return (raw.matches ?? []).map(normalizeMatch);
}

const FINISHED_STATUSES = new Set(['FINISHED', 'AWARDED']);

/**
 * Deriva qué equipos han conseguido plaza en cada fase eliminatoria.
 *
 * DIECISEISAVOS: los 32 equipos se conocen al terminar la fase de grupos.
 *   La API los asigna a partidos SCHEDULED con su nombre real.
 *   → Incluir cualquier equipo con nombre conocido (≠ '?'), sin importar el estado.
 *
 * OCTAVOS en adelante: el equipo solo "existe" en esa fase si ganó su partido anterior.
 *   → Solo partidos FINISHED.
 */
export function deriveClasificadosPorFase(
  partidos: PartidoReal[],
): Record<Exclude<Fase, 'GRUPOS'>, string[]> {
  const fases: Exclude<Fase, 'GRUPOS'>[] = [
    'DIECISEISAVOS', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL',
  ];
  const result = {} as Record<Exclude<Fase, 'GRUPOS'>, string[]>;

  for (const fase of fases) {
    const equipos = new Set<string>();
    for (const partido of partidos) {
      if (partido.fase !== fase) continue;

      if (fase === 'DIECISEISAVOS') {
        // Los 32 clasificados se saben al terminar la fase de grupos.
        // La API pone equipos reales en SCHEDULED una vez se cierran los grupos.
        if (partido.casa !== '?') equipos.add(partido.casa);
        if (partido.fuera !== '?') equipos.add(partido.fuera);
      } else {
        // Para las rondas siguientes: solo equipos que ya han JUGADO y avanzado.
        if (!FINISHED_STATUSES.has(partido.estado)) continue;
        if (partido.casa !== '?') equipos.add(partido.casa);
        if (partido.fuera !== '?') equipos.add(partido.fuera);
      }
    }
    result[fase] = Array.from(equipos);
  }
  return result;
}

/** Campeón / subcampeón desde el partido de la Final ya jugado; tercero del 3er puesto. */
export function derivePodio(rawMatches: RawMatch[]): PrediccionPodio {
  const finalMatch = rawMatches.find(
    (m) => mapStage(m.stage) === 'FINAL' && FINISHED_STATUSES.has(m.status),
  );
  const thirdMatch = rawMatches.find(
    (m) => mapStage(m.stage) === 'TERCER_PUESTO' && FINISHED_STATUSES.has(m.status),
  );

  const winner = (m: RawMatch | undefined) => {
    if (!m) return null;
    if (m.score.winner === 'HOME_TEAM') return teamName(m.homeTeam.name);
    if (m.score.winner === 'AWAY_TEAM') return teamName(m.awayTeam.name);
    return null;
  };
  const loser = (m: RawMatch | undefined) => {
    if (!m) return null;
    if (m.score.winner === 'HOME_TEAM') return teamName(m.awayTeam.name);
    if (m.score.winner === 'AWAY_TEAM') return teamName(m.homeTeam.name);
    return null;
  };

  return {
    campeon: winner(finalMatch),
    subcampeon: loser(finalMatch),
    tercero: winner(thirdMatch),
  };
}

export function normalizeStandings(raw: RawStandingsResponse): PuestoGrupoReal[] {
  const result: PuestoGrupoReal[] = [];
  for (const group of raw.standings ?? []) {
    if (group.type !== 'TOTAL') continue;
    const grupo = normalizeGroupLabel(group.group) ?? group.group ?? '?';
    for (const row of group.table ?? []) {
      result.push({
        grupo,
        posicion: row.position,
        equipo: teamName(row.team.name),
        jugados: row.playedGames,
        ganados: row.won,
        empatados: row.draw,
        perdidos: row.lost,
        golesFavor: row.goalsFor,
        golesContra: row.goalsAgainst,
        puntos: row.points,
      });
    }
  }
  return result;
}

export function normalizeTopScorer(raw: RawScorersResponse): string | null {
  return raw.scorers?.[0]?.player?.name ?? null;
}
