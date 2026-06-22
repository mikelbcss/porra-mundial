import { loadAllParticipants } from '@/excel/discoverParticipants';
import { fetchAllMatches, fetchStandings, fetchTopScorer } from '@/footballApi/client';
import {
  normalizeMatches,
  normalizeStandings,
  normalizeTopScorer,
  deriveClasificadosPorFase,
  derivePodio,
} from '@/footballApi/normalize';
import { calcularLeaderboard, calcularCruces } from '@/scoring/engine';
import type {
  ResultadosReales,
  PuntuacionParticipante,
  CrucesParticipante,
  PrediccionesParticipante,
  PartidoReal,
  PuestoGrupoReal,
  MatchWithPredictions,
  MatchDay,
} from '@/types/domain';

const REFRESH_MS = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS) || 120_000;
const WINDOW_DAYS = Number(import.meta.env.VITE_MATCHDAY_WINDOW_DAYS) || 3;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AppState {
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  leaderboard: PuntuacionParticipante[];
  matchDays: MatchDay[];
  standings: PuestoGrupoReal[];
  cruces: CrucesParticipante[];
  participantNames: string[];
  participantsData: PrediccionesParticipante[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDay(partidos: PartidoReal[], allParticipants: PrediccionesParticipante[]): MatchDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowMs = WINDOW_DAYS * 86_400_000;
  const minDate = new Date(today.getTime() - windowMs);
  const maxDate = new Date(today.getTime() + windowMs + 86_399_999);

  const byDay = new Map<string, PartidoReal[]>();
  for (const p of partidos) {
    const d = new Date(p.fechaUtc);
    if (d < minDate || d > maxDate) continue;
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

async function loadOverrides(): Promise<{ mvp: string | null; maximoGoleador: string | null }> {
  try {
    const res = await fetch('/data/overrides.json');
    if (res.ok) return res.json();
  } catch { /* ignorar */ }
  return { mvp: null, maximoGoleador: null };
}

// ─── Función de refresco ──────────────────────────────────────────────────────

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
    partidos,
    clasificacionGrupos: standings,
    clasificadosPorFase,
    podio: podioReal,
    mvp: overrides.mvp ?? null,
    maximoGoleador: overrides.maximoGoleador ?? topScorer,
    ultimaActualizacion: new Date().toISOString(),
  };

  return {
    leaderboard: calcularLeaderboard(participantsData, resultados),
    cruces: calcularCruces(participantsData, resultados),
    matchDays: groupByDay(partidos, participantsData),
    standings,
    participantNames: participantsData.map((p) => p.nombre),
    participantsData,
    lastUpdated: new Date(),
  };
}

export { REFRESH_MS };
