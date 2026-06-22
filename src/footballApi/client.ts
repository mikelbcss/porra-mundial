import type {
  RawMatchesResponse,
  RawStandingsResponse,
  RawScorersResponse,
} from './rawTypes';

/**
 * Todas las llamadas van a nuestra Netlify Function (proxy),
 * que añade la API key en el servidor. Así la clave nunca
 * aparece en el bundle del cliente ni en el tráfico del browser.
 *
 * En local: arranca con `netlify dev` (no `npm run dev`) para que
 * la función también corra en http://localhost:8888.
 */
const PROXY = '/.netlify/functions/football';
const COMPETITION = (import.meta.env.VITE_COMPETITION as string | undefined) ?? 'WC';

async function apiFetch<T>(apiPath: string): Promise<T> {
  const url = `${PROXY}?path=${encodeURIComponent(apiPath)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`football proxy ${apiPath}: HTTP ${res.status} — ${text}`);
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
