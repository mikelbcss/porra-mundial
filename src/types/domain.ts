/**
 * Tipos del dominio de la Porra Mundial.
 * Se intentan mantener espejados en client/src/types/domain.ts para que el
 * frontend tipe igual la respuesta de la API.
 */

export type Signo = '1' | 'X' | '2';

export type Fase =
  | 'GRUPOS'
  | 'DIECISEISAVOS' // ronda de 32
  | 'OCTAVOS' // ronda de 16
  | 'CUARTOS'
  | 'SEMIS'
  | 'FINAL';

/** Una prediccion de resultado para un partido de fase de grupos. */
export interface PrediccionPartido {
  jornada: string; // "J1" | "J2" | "J3"
  casa: string;
  fuera: string;
  golCasa: number | null;
  golFuera: number | null;
  signo: Signo | null;
}

/** Prediccion de posicion final de un equipo dentro de su grupo. */
export interface PrediccionPosicionGrupo {
  grupo: string;
  seleccion: string;
  posicion: number; // 1..4
}

export interface PrediccionPodio {
  campeon: string | null;
  subcampeon: string | null;
  tercero: string | null;
}

export interface PrediccionJugadores {
  pichichi: string | null;   // Bota de Oro
  pichichi2: string | null;  // Bota de Plata
  pichichi3: string | null;  // Bota de Bronce
  mvp: string | null;        // Balón de Oro
  mvp2: string | null;       // Balón de Plata
  mvp3: string | null;       // Balón de Bronce
}

/** Todas las predicciones leidas del Excel de un participante. */
export interface PrediccionesParticipante {
  nombre: string;
  partidosGrupos: PrediccionPartido[];
  posicionesGrupo: PrediccionPosicionGrupo[];
  dieciseisavos: string[]; // equipos que esa persona cree que pasan a ronda de 32
  octavos: string[];
  cuartos: string[];
  semis: string[];
  tercerPuesto: string[]; // 2 equipos que juegan por el 3er puesto
  final: string[];
  podio: PrediccionPodio;
  jugadores: PrediccionJugadores;
  /** Si hubo algun error leyendo alguna seccion de su Excel, se anota aqui en vez de petar todo. */
  erroresLectura: string[];
}

/* ----------------------- Datos reales (de la API) ----------------------- */

export type EstadoPartido =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'AWARDED';

export interface PartidoReal {
  id: number;
  fechaUtc: string; // ISO date
  estado: EstadoPartido;
  fase: Fase | 'DESCONOCIDA';
  grupo: string | null; // "Group A" -> lo normalizamos a "A"
  casa: string;
  fuera: string;
  golCasa: number | null;
  golFuera: number | null;
  signo: Signo | null;
  jornada: string | null; // "J1" etc, solo aplica si es fase de grupos
}

export interface PuestoGrupoReal {
  grupo: string;
  posicion: number;
  equipo: string;
  jugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  puntos: number;
}

export interface ResultadosReales {
  partidos: PartidoReal[];
  clasificacionGrupos: PuestoGrupoReal[];
  /** Equipos que YA han confirmado clasificacion a cada fase, segun resultados reales. */
  clasificadosPorFase: Record<Exclude<Fase, 'GRUPOS'>, string[]>;
  podio: PrediccionPodio;
  maximoGoleador: string | null;
  mvp: string | null;
  ultimaActualizacion: string; // ISO datetime
}

/* ----------------------------- Puntuacion -------------------------------- */

export interface DesgloseTotalPuntos {
  signoResultado: number;
  resultadosExactos: number;
  clasificadosDieciseisavos: number;
  puestosExactosGrupo: number;
  clasificadosOctavos: number;
  clasificadosCuartos: number;
  clasificadosSemis: number;
  finalistas: number;
  campeon: number;
  subcampeon: number;
  tercero: number;
  balonDeOro: number;
  botaDeOro: number;
}

export interface PuntuacionParticipante {
  nombre: string;
  totalPuntos: number;
  desglose: DesgloseTotalPuntos;
}

/* -------------------------------- Cruces ---------------------------------- */

/** Para la pagina de "clasificacion real": que cruces de eliminatoria ha acertado cada uno. */
export interface AciertoCruce {
  fase: Exclude<Fase, 'GRUPOS'>;
  equipo: string;
  acertado: boolean;
}

export interface CrucesParticipante {
  nombre: string;
  aciertos: AciertoCruce[];
  totalAciertos: number;
}

// ─── Tipos de vista (calculados en dataService) ───────────────────────────────

export interface MatchWithPredictions extends PartidoReal {
  predicciones: Array<{
    participante: string;
    golCasa: number | null;
    golFuera: number | null;
  }>;
}

export interface MatchDay {
  fecha: string;
  partidos: MatchWithPredictions[];
}

// ─── Bracket eliminatorias ────────────────────────────────────────────────────

export interface KnockoutMatch {
  id: number;
  fase: Exclude<Fase, 'GRUPOS'>;
  fechaUtc: string;
  estado: EstadoPartido;
  casa: string;   // '?' si aún no se sabe
  fuera: string;  // '?' si aún no se sabe
  golCasa: number | null;
  golFuera: number | null;
}

// ─── Jugadores con oro/plata/bronce ──────────────────────────────────────────

export interface PrediccionJugadoresExtended {
  pichichi: string | null;       // bota de oro
  pichichi2: string | null;      // bota de plata
  pichichi3: string | null;      // bota de bronce
  mvp: string | null;            // balón de oro
  mvp2: string | null;           // balón de plata
  mvp3: string | null;           // balón de bronce
}
