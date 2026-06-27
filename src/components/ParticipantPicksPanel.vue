<template>
  <div v-if="!data" class="loading-overlay">Selecciona un participante</div>
  <div v-else class="picks">
    <div v-if="data.puntuacion" class="picks__score-banner">
      <span class="picks__score-total">{{ data.puntuacion.totalPuntos }} pts</span>
      <span class="picks__score-label">total</span>
    </div>

    <!-- ── Grupos ── -->
    <section class="picks__section">
      <h3 class="picks__section-title">Fase de Grupos</h3>
      <div class="picks__groups-grid">
        <div v-for="(matches, grupo) in groupedMatches" :key="grupo" class="picks__group-block">
          <h4 class="picks__group-label">Grupo {{ grupo }}</h4>
          <table class="picks__match-table">
            <thead><tr><th>Local</th><th>Pred.</th><th>Visitante</th></tr></thead>
            <tbody>
              <tr v-for="m in matches" :key="`${m.casa}-${m.fuera}`">
                <td class="picks__match-team">{{ m.casa }}</td>
                <td class="picks__match-score">{{ fmt(m.golCasa, m.golFuera) }}</td>
                <td class="picks__match-team">{{ m.fuera }}</td>
              </tr>
            </tbody>
          </table>
          <div class="picks__positions">
            <div v-for="pos in positionsForGroup(grupo)" :key="pos.posicion" class="picks__pos-row">
              <span class="picks__pos-num">{{ pos.posicion }}.</span>
              <span>{{ pos.seleccion }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Eliminatorias con enfrentamientos ── -->
    <section class="picks__section">
      <h3 class="picks__section-title">Eliminatorias</h3>
      <div class="picks__knockout">
        <div v-for="fase in knockoutFases" :key="fase.key" class="picks__knockout-row">
          <span class="picks__knockout-label">{{ fase.label }}</span>
          <div class="picks__knockout-matches">
            <template v-if="pairsForFase(fase.key).length">
              <div
                v-for="(pair, i) in pairsForFase(fase.key)"
                :key="i"
                class="picks__knockout-pair"
              >
                <span>{{ pair[0] }}</span>
                <span class="picks__knockout-vs">vs</span>
                <span>{{ pair[1] ?? '?' }}</span>
              </div>
            </template>
            <span v-else class="picks__knockout-empty">–</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Podio ── -->
    <section class="picks__section">
      <h3 class="picks__section-title">Podio</h3>
      <div class="picks__podium">
        <div class="picks__podium-row"><span>🥇 Campeón</span><strong>{{ data.podio.campeon ?? '–' }}</strong></div>
        <div class="picks__podium-row"><span>🥈 Subcampeón</span><strong>{{ data.podio.subcampeon ?? '–' }}</strong></div>
        <div class="picks__podium-row"><span>🥉 3er puesto</span><strong>{{ data.podio.tercero ?? '–' }}</strong></div>
      </div>
    </section>

    <!-- ── Premios individuales ── -->
    <section class="picks__section">
      <h3 class="picks__section-title">Premios Individuales</h3>
      <div class="picks__awards">
        <div class="picks__award-group">
          <h4 class="picks__award-title">⚽ Bota de Oro</h4>
          <div class="picks__podium">
            <div class="picks__podium-row"><span>🥇 Oro</span><strong>{{ data.jugadores?.pichichi ?? '–' }}</strong></div>
            <div class="picks__podium-row"><span>🥈 Plata</span><strong>{{ data.jugadores?.pichichi2 ?? '–' }}</strong></div>
            <div class="picks__podium-row"><span>🥉 Bronce</span><strong>{{ data.jugadores?.pichichi3 ?? '–' }}</strong></div>
          </div>
        </div>
        <div class="picks__award-group">
          <h4 class="picks__award-title">🏅 Balón de Oro (MVP)</h4>
          <div class="picks__podium">
            <div class="picks__podium-row"><span>🥇 Oro</span><strong>{{ data.jugadores?.mvp ?? '–' }}</strong></div>
            <div class="picks__podium-row"><span>🥈 Plata</span><strong>{{ data.jugadores?.mvp2 ?? '–' }}</strong></div>
            <div class="picks__podium-row"><span>🥉 Bronce</span><strong>{{ data.jugadores?.mvp3 ?? '–' }}</strong></div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="data.erroresLectura.length" class="error-banner">
      <strong>Advertencias al leer el Excel:</strong>
      <ul style="margin-top:.5rem;padding-left:1rem">
        <li v-for="e in data.erroresLectura" :key="e">{{ e }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PrediccionesParticipante, PuntuacionParticipante, PrediccionPartido } from '@/types/domain';

type ParticipantWithScore = PrediccionesParticipante & { puntuacion?: PuntuacionParticipante };
const props = defineProps<{ data: ParticipantWithScore | null }>();

function fmt(a: number | null, b: number | null) {
  return a !== null && b !== null ? `${a}–${b}` : '–';
}

const groupedMatches = computed(() => {
  if (!props.data) return {} as Record<string, PrediccionPartido[]>;
  const grupos = [...new Set(props.data.posicionesGrupo.map((p) => p.grupo))].sort();
  const teamsPerGroup = new Map<string, Set<string>>();
  for (const g of grupos)
    teamsPerGroup.set(g, new Set(props.data.posicionesGrupo.filter((p) => p.grupo === g).map((p) => p.seleccion)));
  const result: Record<string, PrediccionPartido[]> = {};
  for (const g of grupos) {
    const teams = teamsPerGroup.get(g)!;
    result[g] = props.data.partidosGrupos.filter((m) => teams.has(m.casa) || teams.has(m.fuera));
  }
  return result;
});

function positionsForGroup(grupo: string) {
  return props.data?.posicionesGrupo.filter((p) => p.grupo === grupo).sort((a, b) => a.posicion - b.posicion) ?? [];
}

const knockoutFases = [
  { key: 'dieciseisavos', label: 'Dieciseisavos' },
  { key: 'octavos',       label: 'Octavos' },
  { key: 'cuartos',       label: 'Cuartos' },
  { key: 'semis',         label: 'Semifinales' },
  { key: 'tercerPuesto',  label: '3er puesto' },
  { key: 'final',         label: 'Final' },
];

/** Devuelve los equipos de una fase como pares [local, visitante] */
function pairsForFase(key: string): [string, string][] {
  if (!props.data) return [];
  const teams = (props.data as unknown as Record<string, string[]>)[key] ?? [];
  const pairs: [string, string][] = [];
  for (let i = 0; i < teams.length; i += 2)
    pairs.push([teams[i] ?? '?', teams[i + 1] ?? '?']);
  return pairs;
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
.picks {
  &__score-banner { @include card; display:inline-flex; align-items:baseline; gap:$space-2; padding:$space-3 $space-6; background:$color-navy; color:$color-white; margin-bottom:$space-6; }
  &__score-total { font-size:$font-size-2xl; font-weight:700; color:$color-green; }
  &__score-label { font-size:$font-size-sm; opacity:.7; }
  &__section { margin-bottom:$space-8; }
  &__section-title { font-size:$font-size-lg; font-weight:700; color:$color-navy; margin-bottom:$space-4; border-bottom:2px solid $color-green; padding-bottom:$space-2; }
  &__groups-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:$space-4; }
  &__group-block { @include card; overflow:hidden; }
  &__group-label { padding:$space-2 $space-3; background:$color-navy; color:$color-white; font-weight:600; font-size:$font-size-sm; }
  &__match-table { width:100%; border-collapse:collapse; font-size:$font-size-sm; th { background:$color-gray-100; color:$color-gray-700; font-size:$font-size-xs; padding:$space-1 $space-3; text-align:center; border-bottom:1px solid $color-gray-200; } td { padding:$space-2 $space-3; text-align:center; border-bottom:1px solid $color-gray-200; } }
  &__match-team { text-align:left !important; font-weight:500; }
  &__match-score { font-variant-numeric:tabular-nums; font-weight:700; }
  &__positions { padding:$space-2 $space-3; display:flex; flex-direction:column; gap:2px; background:$color-gray-100; }
  &__pos-row { display:flex; gap:$space-2; font-size:$font-size-sm; }
  &__pos-num { font-weight:700; color:$color-gray-400; width:18px; }
  &__knockout { @include card; overflow:hidden; }
  &__knockout-row { display:flex; align-items:flex-start; gap:$space-4; padding:$space-3 $space-4; border-bottom:1px solid $color-gray-200; &:last-child { border-bottom:none; } }
  &__knockout-label { width:110px; flex-shrink:0; font-size:$font-size-sm; font-weight:600; color:$color-navy; padding-top:2px; }
  &__knockout-matches { display:flex; flex-direction:column; gap:$space-2; flex:1; }
  &__knockout-pair { display:flex; align-items:center; gap:$space-2; font-size:$font-size-sm; }
  &__knockout-vs { color:$color-gray-400; font-size:$font-size-xs; }
  &__knockout-empty { font-size:$font-size-sm; color:$color-gray-400; }
  &__podium { @include card; overflow:hidden; }
  &__podium-row { @include flex-between; padding:$space-3 $space-4; border-bottom:1px solid $color-gray-200; font-size:$font-size-sm; &:last-child{border-bottom:none;} strong{font-size:$font-size-md;} }
  &__awards { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:$space-4; }
  &__award-group {}
  &__award-title { font-size:$font-size-sm; font-weight:700; color:$color-navy; margin-bottom:$space-2; }
}
</style>
