<template>
  <div class="group-table">
    <h3 class="group-table__title">Grupo {{ group }}</h3>
    <table class="group-table__table">
      <thead>
        <tr>
          <th>#</th>
          <th class="group-table__team-col">Equipo</th>
          <th title="Jugados">PJ</th>
          <th title="Ganados">G</th>
          <th title="Empatados">E</th>
          <th title="Perdidos">P</th>
          <th title="Goles a favor">GF</th>
          <th title="Goles en contra">GC</th>
          <th title="Diferencia de goles">DG</th>
          <th title="Puntos">Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.equipo"
          :class="['group-table__row', { 'group-table__row--qualified': row.posicion <= 2 }]"
        >
          <td>{{ row.posicion }}</td>
          <td class="group-table__team-col">{{ row.equipo }}</td>
          <td>{{ row.jugados }}</td>
          <td>{{ row.ganados }}</td>
          <td>{{ row.empatados }}</td>
          <td>{{ row.perdidos }}</td>
          <td>{{ row.golesFavor }}</td>
          <td>{{ row.golesContra }}</td>
          <td>{{ row.golesFavor - row.golesContra }}</td>
          <td class="group-table__pts">{{ row.puntos }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { PuestoGrupoReal } from '@/types/domain';
defineProps<{ group: string; rows: PuestoGrupoReal[] }>();
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.group-table {
  @include card;
  overflow: hidden;

  &__title {
    padding: $space-3 $space-4;
    background: $color-navy;
    color: $color-white;
    font-size: $font-size-md;
    font-weight: 700;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: $font-size-sm;

    thead th {
      background: $color-gray-100;
      color: $color-gray-700;
      font-size: $font-size-xs;
      text-transform: uppercase;
      padding: $space-2 $space-3;
      text-align: center;
      border-bottom: 1px solid $color-gray-200;
      font-weight: 600;
    }
  }

  &__team-col { text-align: left !important; font-weight: 500; }

  &__row {
    border-bottom: 1px solid $color-gray-200;
    td { padding: $space-2 $space-3; text-align: center; vertical-align: middle; }
    &:last-child { border-bottom: none; }
    &--qualified { background: rgba($color-mint-light, .4); }
  }

  &__pts { font-weight: 700; color: $color-navy; }
}
</style>
