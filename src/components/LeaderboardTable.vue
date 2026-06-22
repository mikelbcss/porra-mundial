<template>
  <div class="leaderboard">
    <h2 class="leaderboard__title">🏆 Clasificación Porra</h2>
    <div v-if="!items.length" class="loading-overlay">Sin datos aún…</div>
    <table v-else class="leaderboard__table">
      <thead>
        <tr>
          <th class="leaderboard__pos">#</th>
          <th class="leaderboard__name">Participante</th>
          <th class="leaderboard__total">Puntos</th>
          <th v-for="col in detailCols" :key="col.key" class="leaderboard__detail" :title="col.label">
            {{ col.short }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, i) in items"
          :key="item.nombre"
          :class="['leaderboard__row', { 'leaderboard__row--top3': i < 3 }]"
        >
          <td class="leaderboard__pos">
            <span class="leaderboard__medal">{{ medal(i) }}</span>
          </td>
          <td class="leaderboard__name">{{ item.nombre }}</td>
          <td class="leaderboard__total">{{ item.totalPuntos }}</td>
          <td v-for="col in detailCols" :key="col.key" class="leaderboard__detail">
            {{ (item.desglose as unknown as Record<string,number>)[col.key] || 0 }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { PuntuacionParticipante } from '@/types/domain';

defineProps<{ items: PuntuacionParticipante[] }>();

const detailCols = [
  { key: 'signoResultado',           short: '1X2',   label: 'Signo resultado (1/X/2)', value: 3 },
  { key: 'resultadosExactos',          short: 'Exacto', label: 'Resultado exacto', value: 2 },
  { key: 'clasificadoDieciseisavos', short: 'R32',   label: 'Clasificados a dieciseisavos', value: 1 },
  { key: 'posicionGrupo',            short: 'Pos.',  label: 'Posición en grupo', value: 2 },
  { key: 'clasificadoOctavos',       short: 'R16',   label: 'Clasificados a octavos', value: 1 },
  { key: 'clasificadoCuartos',       short: 'QF',    label: 'Clasificados a cuartos', value: 1 },
  { key: 'clasificadoSemis',         short: 'SF',    label: 'Clasificados a semis', value: 1 },
  { key: 'clasificadoFinal',         short: 'F',     label: 'Finalistas', value: 1 },
  { key: 'podio',                    short: 'Podio', label: 'Podio (1º,2º,3º)', value: 3 },
  { key: 'premiosIndividuales',      short: 'Premios', label: 'Pichichi / MVP (máximo goleador y mejor jugador)', value: 2 },
];

function medal(i: number) {
  return ['🥇', '🥈', '🥉'][i] ?? String(i + 1);
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.leaderboard {
  @include card;
  overflow: hidden;

  &__title {
    padding: $space-4 $space-6;
    font-size: $font-size-xl;
    background: $color-navy;
    color: $color-white;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: $font-size-sm;
  }

  thead th {
    background: $color-gray-100;
    color: $color-gray-700;
    font-weight: 600;
    font-size: $font-size-xs;
    text-transform: uppercase;
    letter-spacing: .05em;
    padding: $space-2 $space-3;
    text-align: right;
    border-bottom: 1px solid $color-gray-200;
    white-space: nowrap;

    &.leaderboard__name { text-align: left; }
    &.leaderboard__pos  { text-align: center; }
  }

  &__row {
    border-bottom: 1px solid $color-gray-200;
    transition: background .1s;

    &:hover { background: $color-gray-100; }
    &--top3 { font-weight: 600; }

    td { padding: $space-3; text-align: right; vertical-align: middle; }
  }

  &__pos   { text-align: center !important; width: 48px; }
  &__name  { text-align: left !important; font-weight: 500; }
  &__total { font-size: $font-size-md; font-weight: 700; color: $color-green-dark; }
  &__detail { color: $color-gray-700; }
  &__medal { font-size: 1.2rem; }
}
</style>
