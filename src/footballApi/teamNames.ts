/**
 * Las predicciones de la porra estan en español (asi vienen en los Excel: "España",
 * "Países Bajos", "Costa de Marfil"...) pero la API de resultados reales habla en
 * ingles ("Spain", "Netherlands", "Ivory Coast"...). Para poder cruzar ambas cosas
 * (y saber que "España" del Excel es el mismo equipo que "Spain" de la API) hace
 * falta un diccionario de equivalencias.
 *
 * Estrategia: cada equipo tiene un nombre canonico en español (el que se usa en
 * TODA la app, para que se vea igual en la web que en los Excel) y una lista de
 * alias (variantes en ingles que puede devolver la API, mas variantes con/sin
 * tildes). Al recibir cualquier nombre (de la API o de un Excel) se normaliza
 * (sin tildes, minusculas) y se busca en el diccionario de alias.
 *
 * Si un equipo no aparece aqui (por ejemplo un repescaje que cambia de nombre
 * en el ultimo momento) la app no peta: se queda con el nombre tal cual venga y
 * se loguea un aviso para poder añadirlo en dos minutos.
 */

interface TeamEntry {
  /** Nombre canonico en español, el que se muestra en toda la web. */
  es: string;
  /** Variantes en ingles que puede devolver football-data.org u otras fuentes. */
  aliasesEn: string[];
}

const TEAMS: TeamEntry[] = [
  { es: 'Alemania', aliasesEn: ['Germany'] },
  { es: 'Arabia Saudita', aliasesEn: ['Saudi Arabia'] },
  { es: 'Argelia', aliasesEn: ['Algeria'] },
  { es: 'Argentina', aliasesEn: ['Argentina'] },
  { es: 'Australia', aliasesEn: ['Australia'] },
  { es: 'Austria', aliasesEn: ['Austria'] },
  { es: 'Bélgica', aliasesEn: ['Belgium'] },
  { es: 'Bosnia y Herzegovina', aliasesEn: ['Bosnia and Herzegovina', 'Bosnia & Herzegovina'] },
  { es: 'Brasil', aliasesEn: ['Brazil'] },
  { es: 'Cabo Verde', aliasesEn: ['Cape Verde', 'Cabo Verde'] },
  { es: 'Canadá', aliasesEn: ['Canada'] },
  { es: 'Catar', aliasesEn: ['Qatar'] },
  { es: 'Colombia', aliasesEn: ['Colombia'] },
  { es: 'Corea del Sur', aliasesEn: ['South Korea', 'Korea Republic', 'Korea, South'] },
  { es: 'Costa de Marfil', aliasesEn: ['Ivory Coast', "Côte d'Ivoire", "Cote d'Ivoire"] },
  { es: 'Croacia', aliasesEn: ['Croatia'] },
  { es: 'Curazao', aliasesEn: ['Curaçao', 'Curacao'] },
  { es: 'Ecuador', aliasesEn: ['Ecuador'] },
  { es: 'Egipto', aliasesEn: ['Egypt'] },
  { es: 'Escocia', aliasesEn: ['Scotland'] },
  { es: 'España', aliasesEn: ['Spain'] },
  { es: 'Estados Unidos', aliasesEn: ['United States', 'USA', 'US'] },
  { es: 'Francia', aliasesEn: ['France'] },
  { es: 'Ghana', aliasesEn: ['Ghana'] },
  { es: 'Haití', aliasesEn: ['Haiti'] },
  { es: 'Inglaterra', aliasesEn: ['England'] },
  { es: 'Irak', aliasesEn: ['Iraq'] },
  { es: 'Irán', aliasesEn: ['Iran', 'IR Iran'] },
  { es: 'Japón', aliasesEn: ['Japan'] },
  { es: 'Jordania', aliasesEn: ['Jordan'] },
  { es: 'Marruecos', aliasesEn: ['Morocco'] },
  { es: 'México', aliasesEn: ['Mexico'] },
  { es: 'Noruega', aliasesEn: ['Norway'] },
  { es: 'Nueva Zelanda', aliasesEn: ['New Zealand'] },
  { es: 'Países Bajos', aliasesEn: ['Netherlands', 'Holland'] },
  { es: 'Panamá', aliasesEn: ['Panama'] },
  { es: 'Paraguay', aliasesEn: ['Paraguay'] },
  { es: 'Portugal', aliasesEn: ['Portugal'] },
  { es: 'RD Congo', aliasesEn: ['DR Congo', 'Congo DR', 'DRC'] },
  { es: 'República Checa', aliasesEn: ['Czech Republic', 'Czechia'] },
  { es: 'Senegal', aliasesEn: ['Senegal'] },
  { es: 'Sudáfrica', aliasesEn: ['South Africa'] },
  { es: 'Suecia', aliasesEn: ['Sweden'] },
  { es: 'Suiza', aliasesEn: ['Switzerland'] },
  { es: 'Túnez', aliasesEn: ['Tunisia'] },
  { es: 'Turquía', aliasesEn: ['Turkey', 'Türkiye', 'Turkiye'] },
  { es: 'Uruguay', aliasesEn: ['Uruguay'] },
  { es: 'Uzbekistán', aliasesEn: ['Uzbekistan'] },
];

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeKey(s: string): string {
  return stripAccents(s.trim().toLowerCase()).replace(/\s+/g, ' ');
}

const ALIAS_TO_CANONICAL = new Map<string, string>();
for (const team of TEAMS) {
  ALIAS_TO_CANONICAL.set(normalizeKey(team.es), team.es);
  for (const alias of team.aliasesEn) {
    ALIAS_TO_CANONICAL.set(normalizeKey(alias), team.es);
  }
}

const unknownTeamsLogged = new Set<string>();

/**
 * Devuelve el nombre canonico en español de un equipo a partir de cualquier
 * variante conocida (español o ingles, con o sin tildes). Si no se reconoce,
 * devuelve el nombre original tal cual (recortado de espacios) y avisa por
 * consola una sola vez para poder añadirlo al diccionario.
 */
export function canonicalTeamName(rawName: string | null | undefined): string | null {
  if (!rawName) return null;
  const trimmed = rawName.trim();
  if (!trimmed) return null;
  const canonical = ALIAS_TO_CANONICAL.get(normalizeKey(trimmed));
  if (canonical) return canonical;
  if (!unknownTeamsLogged.has(trimmed)) {
    unknownTeamsLogged.add(trimmed);
    // eslint-disable-next-line no-console
    console.warn(
      `[teamNames] Equipo no reconocido: "${trimmed}". Se usara tal cual. ` +
        `Añadelo a TEAMS en server/src/footballApi/teamNames.ts si hace falta.`
    );
  }
  return trimmed;
}

export const ALL_KNOWN_TEAMS_ES = TEAMS.map((t) => t.es);
