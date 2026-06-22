<template>
  <div v-if="!data" class="loading-overlay">Selecciona un participante</div>
  <div v-else class="picks">
    <div v-if="data.puntuacion" class="picks__score-banner">
      <span class="picks__score-total">{{ data.puntuacion.totalPuntos }} pts</span>
      <span class="picks__score-label">total</span>
    </div>

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
                <td class="picks__match-score">{{ m.golCasa !== null && m.golFuera !== null ? `${m.golCasa}–${m.golFuera}` : '–' }}</td>
                <td class="picks__match-team">{{ m.fuera }}</td>
              </tr>
            </tbody>
          </table>
          <div class="picks__positions">
            <div v-for="pos in positionsForGroup(grupo)" :key="pos.posicion" class="picks__pos-row">
              <span class="picks__pos-num">{{ pos.posicion }}.</span>
              <span class="picks__pos-team">{{ pos.seleccion }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="picks__section">
      <h3 class="picks__section-title">Eliminatorias</h3>
      <div class="picks__knockout">
        <div v-for="fase in knockoutFases" :key="fase.key" class="picks__knockout-row">
          <span class="picks__knockout-label">{{ fase.label }}</span>
          <div class="picks__knockout-teams">
            <span v-for="team in teamsForFase(fase.key)" :key="team" class="picks__knockout-team">{{ team }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="picks__section">
      <h3 class="picks__section-title">Podio y Premios</h3>
      <div class="picks__podium">
        <div class="picks__podium-row"><span>🥇 Campeón</span><strong>{{ data.podio.campeon ?? '–' }}</strong></div>
        <div class="picks__podium-row"><span>🥈 Subcampeón</span><strong>{{ data.podio.subcampeon ?? '–' }}</strong></div>
        <div class="picks__podium-row"><span>🥉 Tercero</span><strong>{{ data.podio.tercero ?? '–' }}</strong></div>
        <div class="picks__podium-row"><span>⚽ Pichichi</span><strong>{{ data.jugadores?.pichichi ?? '–' }}</strong></div>
        <div class="picks__podium-row"><span>🏅 MVP</span><strong>{{ data.jugadores?.mvp ?? '–' }}</strong></div>
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

const groupedMatches = computed(() => {
  if (!props.data) return {} as Record<string, PrediccionPartido[]>;
  const grupos = [...new Set(props.data.posicionesGrupo.map((p) => p.grupo))].sort();
  const teamsPerGroup = new Map<string, Set<string>>();
  for (const g of grupos) {
    teamsPerGroup.set(g, new Set(props.data.posicionesGrupo.filter((p) => p.grupo === g).map((p) => p.seleccion)));
  }
  const result: Record<string, typeof props.data.partidosGrupos> = {};
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
  { key: 'octavos', label: 'Octavos' },
  { key: 'cuartos', label: 'Cuartos' },
  { key: 'semis', label: 'Semifinales' },
  { key: 'tercerPuesto', label: '3er puesto' },
  { key: 'final', label: 'Final' },
];

function teamsForFase(key: string): string[] {
  if (!props.data) return [];
  return (props.data as unknown as Record<string, string[]>)[key] ?? [];
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
  &__knockout-label { width:120px; flex-shrink:0; font-size:$font-size-sm; font-weight:600; color:$color-navy; }
  &__knockout-teams { display:flex; flex-wrap:wrap; gap:$space-1; }
  &__knockout-team { font-size:$font-size-xs; background:$color-mint-light; color:$color-green-dark; border-radius:$radius-sm; padding:2px $space-2; font-weight:600; }
  &__podium { @include card; overflow:hidden; }
  &__podium-row { @include flex-between; padding:$space-3 $space-4; border-bottom:1px solid $color-gray-200; font-size:$font-size-sm; &:last-child { border-bottom:none; } strong { font-size:$font-size-md; } }
}
</style>
