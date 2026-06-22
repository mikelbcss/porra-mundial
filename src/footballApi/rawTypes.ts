/** Formas (recortadas a lo que usamos) de las respuestas de api.football-data.org/v4 */

export interface RawTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface RawScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: string;
  fullTime: { home: number | null; away: number | null };
  halfTime?: { home: number | null; away: number | null };
}

export interface RawMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: RawTeam;
  awayTeam: RawTeam;
  score: RawScore;
}

export interface RawMatchesResponse {
  matches: RawMatch[];
}

export interface RawStandingRow {
  position: number;
  team: RawTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface RawStandingGroup {
  stage: string;
  type: string;
  group: string | null;
  table: RawStandingRow[];
}

export interface RawStandingsResponse {
  standings: RawStandingGroup[];
}

export interface RawScorer {
  player: { id: number; name: string };
  team: RawTeam;
  goals: number;
}

export interface RawScorersResponse {
  scorers: RawScorer[];
}
