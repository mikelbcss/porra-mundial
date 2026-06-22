import type {
  RawMatchesResponse,
  RawStandingsResponse,
  RawScorersResponse,
} from './rawTypes';

const BASE = 'https://api.football-data.org/v4';
const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY as string;
const COMPETITION = (import.meta.env.VITE_COMPETITION as string | undefined) ?? 'WC';

function headers(): HeadersInit {
  return { 'X-Auth-Token': API_KEY };
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) {
    throw new Error(`football-data.org ${path}: HTTP ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchAllMatches(): Promise<RawMatchesResponse> {
  return apiFetch<RawMatchesResponse>(`/competitions/${COMPETITION}/matches`);
}

export async function fetchStandings(): Promise<RawStandingsResponse> {
  return apiFetch<RawStandingsResponse>(`/competitions/${COMPETITION}/standings`);
}

export async function fetchTopScorer(): Promise<RawScorersResponse> {
  return apiFetch<RawScorersResponse>(`/competitions/${COMPETITION}/scorers?limit=1`);
}
