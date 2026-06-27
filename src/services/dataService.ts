import { loadAllParticipants } from '@/excel/discoverParticipants';
import { fetchAllMatches, fetchStandings, fetchTopScorer } from '@/footballApi/client';
import {
  normalizeMatches, normalizeStandings, normalizeTopScorer,
  deriveClasificadosPorFase, derivePodio,
} from '@/footballApi/normalize';
import { calcularLeaderboard, calcularCruces } from '@/scoring/engine';
import type {
  ResultadosReales, PuntuacionParticipante, CrucesParticipante,
  PrediccionesParticipante, PartidoReal, PuestoGrupoReal,
  MatchWithPredictions, MatchDay, KnockoutMatch,
} from '@/types/domain';

export const REFRESH_MS = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS) || 120_000;

export interface AppState {
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  leaderboard: PuntuacionParticipante[];
  allMatchDays: MatchDay[];           // TODOS los días (para navegación)
  knockoutMatches: KnockoutMatch[];   // bracket real de eliminatorias
  standings: PuestoGrupoReal[];
  cruces: CrucesParticipante[];
  participantNames: string[];
  participantsData: PrediccionesParticipante[];
}

// Agrupa TODOS los partidos por día (sin filtro de ventana)
function groupAllByDay(
  partidos: PartidoReal[],
  allParticipants: PrediccionesParticipante[],
): MatchDay[] {
  const byDay = new Map<string, PartidoReal[]>();
  for (const p of partidos) {
    const key = p.fechaUtc.slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(p);
  }
  const days: MatchDay[] = [];
  for (const [fecha, ps] of [...byDay.entries()].sort()) {
    const withPreds: MatchWithPredictions[] = ps.map((p) => ({
      ...p,
      predicciones: allParticipants.map((part) => {
        const pred = part.partidosGrupos.find(
          (pg) => pg.casa === p.casa && pg.fuera === p.fuera,
        );
        return { participante: part.nombre, golCasa: pred?.golCasa ?? null, golFuera: pred?.golFuera ?? null };
      }),
    }));
    days.push({ fecha, partidos: withPreds });
  }
  return days;
}

// Knockout bracket: partidos de fases eliminatorias con team o "?" si TBD
function extractKnockoutMatches(partidos: PartidoReal[]): KnockoutMatch[] {
  const knockout: KnockoutMatch[] = [];
  const FASES_ORDER = ['DIECISEISAVOS', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'TERCER_PUESTO', 'FINAL'];
  for (const fase of FASES_ORDER) {
    const ps = partidos
      .filter((p) => p.fase === fase)
      .sort((a, b) => a.fechaUtc.localeCompare(b.fechaUtc));
    for (const p of ps) {
      knockout.push({
        id: p.id,
        fase: p.fase as KnockoutMatch['fase'],
        fechaUtc: p.fechaUtc,
        estado: p.estado,
        casa: p.casa || '?',
        fuera: p.fuera || '?',
        golCasa: p.golCasa,
        golFuera: p.golFuera,
      });
    }
  }
  return knockout;
}

async function loadOverrides() {
  try {
    const res = await fetch('/data/overrides.json');
    if (res.ok) return res.json();
  } catch { /**/ }
  return { mvp: null, maximoGoleador: null };
}

export async function refreshData(): Promise<Partial<AppState>> {
  const [participantsData, rawMatches, rawStandings, rawScorers, overrides] = await Promise.all([
    loadAllParticipants(),
    fetchAllMatches(),
    fetchStandings(),
    fetchTopScorer(),
    loadOverrides(),
  ]);

  const partidos = normalizeMatches(rawMatches);
  const standings = normalizeStandings(rawStandings);
  const topScorer = normalizeTopScorer(rawScorers);
  const clasificadosPorFase = deriveClasificadosPorFase(partidos);
  const podioReal = derivePodio(rawMatches.matches);

  const resultados: ResultadosReales = {
    partidos, clasificacionGrupos: standings, clasificadosPorFase,
    podio: podioReal,
    mvp: overrides.mvp ?? null,
    maximoGoleador: overrides.maximoGoleador ?? topScorer,
    ultimaActualizacion: new Date().toISOString(),
  };

  return {
    leaderboard: calcularLeaderboard(participantsData, resultados),
    cruces: calcularCruces(participantsData, resultados),
    allMatchDays: groupAllByDay(partidos, participantsData),
    knockoutMatches: extractKnockoutMatches(partidos),
    standings,
    participantNames: participantsData.map((p) => p.nombre),
    participantsData,
    lastUpdated: new Date(),
  };
}
