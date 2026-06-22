import {
  AciertoCruce,
  CrucesParticipante,
  DesgloseTotalPuntos,
  Fase,
  PrediccionesParticipante,
  PuntuacionParticipante,
  ResultadosReales,
} from '@/types/domain';

/** Puntos por cada cosa, tal cual estaban definidos (aunque comentados) en el notebook. */
export const PUNTOS = {
  SIGNO: 3,
  RESULTADO_EXACTO: 2,
  CLASIFICADO_DIECISEISAVOS: 3,
  PUESTO_EXACTO_GRUPO: 2,
  CLASIFICADO_OCTAVOS: 10,
  CLASIFICADO_CUARTOS: 20,
  CLASIFICADO_SEMIS: 30,
  FINALISTA: 40,
  CAMPEON: 20,
  SUBCAMPEON: 10,
  TERCERO: 5,
  BALON_DE_ORO: 25,
  BOTA_DE_ORO: 25,
} as const;

const FASES_ELIMINATORIA: Exclude<Fase, 'GRUPOS'>[] = [
  'DIECISEISAVOS',
  'OCTAVOS',
  'CUARTOS',
  'SEMIS',
  'FINAL',
];

function intersectionCount(predicho: string[], real: string[]): number {
  const realSet = new Set(real);
  return predicho.filter((equipo) => realSet.has(equipo)).length;
}

function picksForFase(prediccion: PrediccionesParticipante, fase: Exclude<Fase, 'GRUPOS'>): string[] {
  switch (fase) {
    case 'DIECISEISAVOS':
      return prediccion.dieciseisavos;
    case 'OCTAVOS':
      return prediccion.octavos;
    case 'CUARTOS':
      return prediccion.cuartos;
    case 'SEMIS':
      return prediccion.semis;
    case 'FINAL':
      return prediccion.final;
  }
}

function puntosPorFase(fase: Exclude<Fase, 'GRUPOS'>): number {
  switch (fase) {
    case 'DIECISEISAVOS':
      return PUNTOS.CLASIFICADO_DIECISEISAVOS;
    case 'OCTAVOS':
      return PUNTOS.CLASIFICADO_OCTAVOS;
    case 'CUARTOS':
      return PUNTOS.CLASIFICADO_CUARTOS;
    case 'SEMIS':
      return PUNTOS.CLASIFICADO_SEMIS;
    case 'FINAL':
      return PUNTOS.FINALISTA;
  }
}

/** Puntos de resultados (signo + marcador exacto) de la fase de grupos. */
function puntuarPartidosGrupos(
  prediccion: PrediccionesParticipante,
  real: ResultadosReales
): { signoResultado: number; resultadosExactos: number } {
  const partidosRealesPorClave = new Map<string, ResultadosReales['partidos'][number]>();
  for (const partido of real.partidos) {
    if (partido.fase !== 'GRUPOS') continue;
    partidosRealesPorClave.set(`${partido.casa}__${partido.fuera}`, partido);
  }

  let signoResultado = 0;
  let resultadosExactos = 0;

  for (const pred of prediccion.partidosGrupos) {
    const partidoReal = partidosRealesPorClave.get(`${pred.casa}__${pred.fuera}`);
    if (!partidoReal || partidoReal.golCasa === null || partidoReal.golFuera === null) continue;

    if (pred.signo && partidoReal.signo && pred.signo === partidoReal.signo) {
      signoResultado += PUNTOS.SIGNO;
    }
    if (
      pred.golCasa !== null &&
      pred.golFuera !== null &&
      pred.golCasa === partidoReal.golCasa &&
      pred.golFuera === partidoReal.golFuera
    ) {
      resultadosExactos += PUNTOS.RESULTADO_EXACTO;
    }
  }

  return { signoResultado, resultadosExactos };
}

/**
 * 2 puntos por cada puesto de grupo exacto, pero SOLO contando equipos que
 * realmente se clasificaron a dieciseisavos (igual que el comentario del
 * notebook: acertar que alguien queda 3º/4º sin clasificar no puntua).
 */
function puntuarPuestosGrupo(
  prediccion: PrediccionesParticipante,
  real: ResultadosReales
): number {
  const clasificados = new Set(real.clasificadosPorFase.DIECISEISAVOS);
  const realPosPorEquipo = new Map<string, number>();
  for (const fila of real.clasificacionGrupos) {
    realPosPorEquipo.set(fila.equipo, fila.posicion);
  }

  let puntos = 0;
  for (const pick of prediccion.posicionesGrupo) {
    if (!clasificados.has(pick.seleccion)) continue;
    const posicionReal = realPosPorEquipo.get(pick.seleccion);
    if (posicionReal !== undefined && posicionReal === pick.posicion) {
      puntos += PUNTOS.PUESTO_EXACTO_GRUPO;
    }
  }
  return puntos;
}

export function calcularPuntuacion(
  prediccion: PrediccionesParticipante,
  real: ResultadosReales
): PuntuacionParticipante {
  const { signoResultado, resultadosExactos } = puntuarPartidosGrupos(prediccion, real);
  const puestosExactosGrupo = puntuarPuestosGrupo(prediccion, real);

  const porFase: Record<Exclude<Fase, 'GRUPOS'>, number> = {
    DIECISEISAVOS: 0,
    OCTAVOS: 0,
    CUARTOS: 0,
    SEMIS: 0,
    FINAL: 0,
  };
  for (const fase of FASES_ELIMINATORIA) {
    const aciertos = intersectionCount(picksForFase(prediccion, fase), real.clasificadosPorFase[fase]);
    porFase[fase] = aciertos * puntosPorFase(fase);
  }

  const campeon =
    prediccion.podio.campeon && real.podio.campeon && prediccion.podio.campeon === real.podio.campeon
      ? PUNTOS.CAMPEON
      : 0;
  const subcampeon =
    prediccion.podio.subcampeon &&
    real.podio.subcampeon &&
    prediccion.podio.subcampeon === real.podio.subcampeon
      ? PUNTOS.SUBCAMPEON
      : 0;
  const tercero =
    prediccion.podio.tercero && real.podio.tercero && prediccion.podio.tercero === real.podio.tercero
      ? PUNTOS.TERCERO
      : 0;

  const balonDeOro =
    prediccion.jugadores.mvp && real.mvp && prediccion.jugadores.mvp === real.mvp
      ? PUNTOS.BALON_DE_ORO
      : 0;
  const botaDeOro =
    prediccion.jugadores.pichichi &&
    real.maximoGoleador &&
    prediccion.jugadores.pichichi === real.maximoGoleador
      ? PUNTOS.BOTA_DE_ORO
      : 0;

  const desglose: DesgloseTotalPuntos = {
    signoResultado,
    resultadosExactos,
    clasificadosDieciseisavos: porFase.DIECISEISAVOS,
    puestosExactosGrupo,
    clasificadosOctavos: porFase.OCTAVOS,
    clasificadosCuartos: porFase.CUARTOS,
    clasificadosSemis: porFase.SEMIS,
    finalistas: porFase.FINAL,
    campeon,
    subcampeon,
    tercero,
    balonDeOro,
    botaDeOro,
  };

  const totalPuntos = Object.values(desglose).reduce((a, b) => a + b, 0);

  return { nombre: prediccion.nombre, totalPuntos, desglose };
}

export function calcularLeaderboard(
  participantes: PrediccionesParticipante[],
  real: ResultadosReales
): PuntuacionParticipante[] {
  return participantes
    .map((p) => calcularPuntuacion(p, real))
    .sort((a, b) => b.totalPuntos - a.totalPuntos);
}

/** Para la pagina de "clasificacion real": que cruces de eliminatoria ha acertado cada uno. */
export function calcularCruces(
  participantes: PrediccionesParticipante[],
  real: ResultadosReales
): CrucesParticipante[] {
  return participantes.map((prediccion) => {
    const aciertos: AciertoCruce[] = [];
    for (const fase of FASES_ELIMINATORIA) {
      const realFase = new Set(real.clasificadosPorFase[fase]);
      for (const equipo of picksForFase(prediccion, fase)) {
        aciertos.push({ fase, equipo, acertado: realFase.has(equipo) });
      }
    }
    return {
      nombre: prediccion.nombre,
      aciertos,
      totalAciertos: aciertos.filter((a) => a.acertado).length,
    };
  });
}
